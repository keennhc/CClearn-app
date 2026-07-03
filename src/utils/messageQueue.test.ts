import AsyncStorage from '@react-native-async-storage/async-storage';
import { messageQueue, createLocalId, QueuedMessage } from './messageQueue';

jest.mock('@react-native-async-storage/async-storage');

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const baseItem: Omit<QueuedMessage, 'status'> = {
  localId: 'local-1',
  communityId: 'c1',
  message: 'Hello',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('createLocalId', () => {
  it('generates a unique id on each call', () => {
    expect(createLocalId()).not.toBe(createLocalId());
  });
});

describe('messageQueue', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('enqueue', () => {
    it('appends a new item with status pending to an empty queue', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      await messageQueue.enqueue('c1', baseItem);

      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'message_queue:c1',
        JSON.stringify([{ ...baseItem, status: 'pending' }]),
      );
    });

    it('appends to an existing queue for the same community', async () => {
      const existing: QueuedMessage = { ...baseItem, localId: 'local-0', status: 'pending' };
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existing]));

      await messageQueue.enqueue('c1', { ...baseItem, localId: 'local-1' });

      const [, written] = mockedAsyncStorage.setItem.mock.calls[0];
      expect(JSON.parse(written)).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('returns an empty array when nothing is stored', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      expect(await messageQueue.getAll('c1')).toEqual([]);
    });

    it('returns the parsed items for the given community', async () => {
      const stored: QueuedMessage = { ...baseItem, status: 'pending' };
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([stored]));

      expect(await messageQueue.getAll('c1')).toEqual([stored]);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('message_queue:c1');
    });
  });

  describe('markStatus', () => {
    it('updates only the matching item', async () => {
      const items: QueuedMessage[] = [
        { ...baseItem, localId: 'a', status: 'pending' },
        { ...baseItem, localId: 'b', status: 'pending' },
      ];
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(items));

      await messageQueue.markStatus('c1', 'a', 'failed');

      const [, written] = mockedAsyncStorage.setItem.mock.calls[0];
      const saved: QueuedMessage[] = JSON.parse(written);
      expect(saved.find((i) => i.localId === 'a')?.status).toBe('failed');
      expect(saved.find((i) => i.localId === 'b')?.status).toBe('pending');
    });
  });

  describe('remove', () => {
    it('removes only the matching item', async () => {
      const items: QueuedMessage[] = [
        { ...baseItem, localId: 'a', status: 'pending' },
        { ...baseItem, localId: 'b', status: 'pending' },
      ];
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(items));

      await messageQueue.remove('c1', 'a');

      const [, written] = mockedAsyncStorage.setItem.mock.calls[0];
      const saved: QueuedMessage[] = JSON.parse(written);
      expect(saved.map((i) => i.localId)).toEqual(['b']);
    });
  });
});
