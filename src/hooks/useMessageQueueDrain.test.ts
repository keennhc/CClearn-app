import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMessageQueueDrain } from './useMessageQueueDrain';
import { uploadFile } from '../services/upload';
import * as messagesService from '../services/messages';
import { useIsOnline } from './useIsOnline';

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('./useIsOnline', () => ({ useIsOnline: jest.fn() }));
jest.mock('../services/upload', () => ({ uploadFile: jest.fn() }));
jest.mock('../services/messages', () => ({ sendMessage: jest.fn() }));

jest.mock('../utils/messageQueue', () => {
  const stores: Record<string, any[]> = {};
  return {
    createLocalId: jest.fn(() => `local-${Math.random().toString(36).slice(2, 8)}`),
    __setStore: (communityId: string, items: any[]) => {
      stores[communityId] = items;
    },
    __getStore: (communityId: string) => stores[communityId] || [],
    messageQueue: {
      enqueue: jest.fn(async (communityId: string, item: any) => {
        stores[communityId] = [...(stores[communityId] || []), { ...item, status: 'pending' }];
      }),
      getAll: jest.fn(async (communityId: string) => stores[communityId] || []),
      markStatus: jest.fn(async (communityId: string, localId: string, status: string) => {
        stores[communityId] = (stores[communityId] || []).map((i: any) =>
          i.localId === localId ? { ...i, status } : i,
        );
      }),
      remove: jest.fn(async (communityId: string, localId: string) => {
        stores[communityId] = (stores[communityId] || []).filter((i: any) => i.localId !== localId);
      }),
    },
  };
});

const mockedUseIsOnline = useIsOnline as jest.Mock;
const mockedSendMessage = messagesService.sendMessage as jest.Mock;
const mockedUploadFile = uploadFile as jest.Mock;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mqModule = jest.requireMock('../utils/messageQueue') as any;

describe('useMessageQueueDrain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseIsOnline.mockReturnValue(true);
  });

  it('sends a pending message and removes it from the queue on success', async () => {
    mqModule.__setStore('c1', [
      { localId: 'a', communityId: 'c1', message: 'hi', createdAt: '2024-01-01', status: 'pending' },
    ]);
    mockedSendMessage.mockResolvedValue({ id: 'server-1' });

    renderHook(() => useMessageQueueDrain('c1'));

    await waitFor(() => expect(mockedSendMessage).toHaveBeenCalledWith('c1', {
      message: 'hi',
      attachmentUrl: undefined,
      attachmentType: undefined,
      attachmentName: undefined,
    }));
    await waitFor(() => expect(mqModule.__getStore('c1')).toEqual([]));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['messages', 'c1'] });
  });

  it('uploads a queued attachment before sending, then sends the resulting url', async () => {
    mqModule.__setStore('c2', [
      {
        localId: 'a',
        communityId: 'c2',
        message: null,
        localAttachmentUri: 'file:///tmp/photo.jpg',
        attachmentType: 'IMAGE',
        createdAt: '2024-01-01',
        status: 'pending',
      },
    ]);
    mockedUploadFile.mockResolvedValue({ url: 'https://cdn.example.com/photo.jpg' });
    mockedSendMessage.mockResolvedValue({ id: 'server-1' });

    renderHook(() => useMessageQueueDrain('c2'));

    await waitFor(() => expect(mockedUploadFile).toHaveBeenCalledWith('file:///tmp/photo.jpg', 'chat-media'));
    await waitFor(() =>
      expect(mockedSendMessage).toHaveBeenCalledWith(
        'c2',
        expect.objectContaining({ attachmentUrl: 'https://cdn.example.com/photo.jpg' }),
      ),
    );
  });

  it('marks a message failed and stops draining the rest of the queue', async () => {
    mqModule.__setStore('c3', [
      { localId: 'a', communityId: 'c3', message: 'first', createdAt: '2024-01-01', status: 'pending' },
      { localId: 'b', communityId: 'c3', message: 'second', createdAt: '2024-01-02', status: 'pending' },
    ]);
    mockedSendMessage.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useMessageQueueDrain('c3'));

    await waitFor(() => expect(result.current.queuedMessages.find((m) => m.localId === 'a')?.status).toBe('failed'));
    expect(mockedSendMessage).toHaveBeenCalledTimes(1);
    expect(result.current.queuedMessages.find((m) => m.localId === 'b')?.status).toBe('pending');
  });

  it('does not attempt to send while offline', async () => {
    mockedUseIsOnline.mockReturnValue(false);
    mqModule.__setStore('c4', [
      { localId: 'a', communityId: 'c4', message: 'hi', createdAt: '2024-01-01', status: 'pending' },
    ]);

    renderHook(() => useMessageQueueDrain('c4'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockedSendMessage).not.toHaveBeenCalled();
  });

  it('enqueue adds a message and triggers a send', async () => {
    mqModule.__setStore('c5', []);
    mockedSendMessage.mockResolvedValue({ id: 'server-1' });

    const { result } = renderHook(() => useMessageQueueDrain('c5'));
    await waitFor(() => expect(result.current.queuedMessages).toEqual([]));

    await act(async () => {
      await result.current.enqueue({ message: 'new message' });
    });

    await waitFor(() => expect(mockedSendMessage).toHaveBeenCalledWith('c5', expect.objectContaining({ message: 'new message' })));
  });

  it('retry resets a failed message to pending and resumes draining', async () => {
    mqModule.__setStore('c6', [
      { localId: 'a', communityId: 'c6', message: 'first', createdAt: '2024-01-01', status: 'failed' },
    ]);
    mockedSendMessage.mockResolvedValue({ id: 'server-1' });

    const { result } = renderHook(() => useMessageQueueDrain('c6'));
    await waitFor(() => expect(result.current.queuedMessages[0]?.status).toBe('failed'));
    expect(mockedSendMessage).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.retry('a');
    });

    await waitFor(() => expect(mockedSendMessage).toHaveBeenCalledWith('c6', expect.objectContaining({ message: 'first' })));
  });
});
