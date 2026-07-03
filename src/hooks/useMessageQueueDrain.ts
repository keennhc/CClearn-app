import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { messageQueue, QueuedMessage, createLocalId } from '../utils/messageQueue';
import { uploadFile } from '../services/upload';
import * as messagesService from '../services/messages';
import { useIsOnline } from './useIsOnline';

interface EnqueuePayload {
  message: string | null;
  localAttachmentUri?: string;
  attachmentType?: QueuedMessage['attachmentType'];
  attachmentName?: string;
}

export function useMessageQueueDrain(communityId: string) {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const isOnline = useIsOnline();
  const draining = useRef(false);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    if (!communityId) return;
    setQueuedMessages(await messageQueue.getAll(communityId));
  }, [communityId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Drains strictly in queue order, re-reading storage after each send so a
  // message enqueued mid-drain (e.g. the user sends a second message while
  // the first is still uploading) gets picked up in the same pass. A failed
  // item blocks everything behind it until the user retries.
  const drain = useCallback(async () => {
    if (draining.current || !communityId) return;
    draining.current = true;
    try {
      for (;;) {
        const items = await messageQueue.getAll(communityId);
        const item = items[0];
        if (!item || item.status !== 'pending') break;

        await messageQueue.markStatus(communityId, item.localId, 'sending');

        try {
          let attachmentUrl = item.attachmentUrl;
          if (item.localAttachmentUri && !attachmentUrl) {
            const uploaded = await uploadFile(item.localAttachmentUri, 'chat-media');
            attachmentUrl = uploaded.url;
          }
          await messagesService.sendMessage(communityId, {
            message: item.message ?? undefined,
            attachmentUrl,
            attachmentType: item.attachmentType,
            attachmentName: item.attachmentName,
          });
          await messageQueue.remove(communityId, item.localId);
          queryClient.invalidateQueries({ queryKey: ['messages', communityId] });
        } catch {
          await messageQueue.markStatus(communityId, item.localId, 'failed');
          break;
        }
      }
    } finally {
      await refresh();
      draining.current = false;
    }
  }, [communityId, queryClient, refresh]);

  // Triggered by connectivity regained (and once on mount) -- NOT by
  // queuedMessages changes, since refresh() always produces a new array
  // reference and that would re-fire this effect forever.
  useEffect(() => {
    if (isOnline) drain();
  }, [isOnline, drain]);

  const enqueue = useCallback(
    async (payload: EnqueuePayload) => {
      await messageQueue.enqueue(communityId, {
        localId: createLocalId(),
        communityId,
        message: payload.message,
        localAttachmentUri: payload.localAttachmentUri,
        attachmentType: payload.attachmentType,
        attachmentName: payload.attachmentName,
        createdAt: new Date().toISOString(),
      });
      await refresh();
      drain();
    },
    [communityId, refresh, drain],
  );

  const retry = useCallback(
    async (localId: string) => {
      await messageQueue.markStatus(communityId, localId, 'pending');
      await refresh();
      drain();
    },
    [communityId, refresh, drain],
  );

  return { queuedMessages, isOnline, enqueue, retry };
}
