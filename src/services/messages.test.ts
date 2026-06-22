import { getMessages, sendMessage } from './messages';
import api from './api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockMessage = {
  id: 'm1',
  content: 'Hello',
  communityId: 'c1',
  senderId: 'u1',
  senderFirstName: 'John',
  senderLastName: 'Doe',
  createdAt: '2024-01-01',
};

describe('messages service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches paginated messages for a community', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        success: true,
        data: { items: [mockMessage], total: 1, page: 1, limit: 50, totalPages: 1 },
      },
    });
    const result = await getMessages('c1', { page: 1, limit: 50 });
    expect(mockedApi.get).toHaveBeenCalledWith('/communities/c1/messages', {
      params: { page: 1, limit: 50 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toBe('Hello');
  });

  it('sends a message to a community', async () => {
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: mockMessage },
    });
    const result = await sendMessage('c1', { content: 'Hello' });
    expect(mockedApi.post).toHaveBeenCalledWith('/communities/c1/messages', { content: 'Hello' });
    expect(result).toEqual(mockMessage);
  });
});
