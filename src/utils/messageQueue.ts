import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedMessage {
  localId: string; // client-generated, used as the React key before a server id exists
  communityId: string;
  message: string | null;
  localAttachmentUri?: string; // picked but not yet uploaded
  attachmentUrl?: string; // set once uploaded (drain skips the upload step when present)
  attachmentType?: 'IMAGE' | 'VIDEO' | 'GIF' | 'FILE';
  attachmentName?: string;
  createdAt: string; // client timestamp, for optimistic ordering
  status: 'pending' | 'sending' | 'failed';
}

const keyFor = (communityId: string) => `message_queue:${communityId}`;

async function readAll(communityId: string): Promise<QueuedMessage[]> {
  const raw = await AsyncStorage.getItem(keyFor(communityId));
  return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
}

async function writeAll(communityId: string, items: QueuedMessage[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(communityId), JSON.stringify(items));
}

export function createLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const messageQueue = {
  async enqueue(communityId: string, item: Omit<QueuedMessage, 'status'>): Promise<void> {
    const items = await readAll(communityId);
    items.push({ ...item, status: 'pending' });
    await writeAll(communityId, items);
  },

  getAll(communityId: string): Promise<QueuedMessage[]> {
    return readAll(communityId);
  },

  async markStatus(communityId: string, localId: string, status: QueuedMessage['status']): Promise<void> {
    const items = await readAll(communityId);
    await writeAll(
      communityId,
      items.map((item) => (item.localId === localId ? { ...item, status } : item)),
    );
  },

  async remove(communityId: string, localId: string): Promise<void> {
    const items = await readAll(communityId);
    await writeAll(
      communityId,
      items.filter((item) => item.localId !== localId),
    );
  },
};
