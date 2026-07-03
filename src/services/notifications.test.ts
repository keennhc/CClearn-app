import { registerToken, unregisterToken } from './notifications';
import api from './api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('notifications service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a push token', async () => {
    mockedApi.post.mockResolvedValue({});
    await registerToken('ExponentPushToken[abc]', 'ios');
    expect(mockedApi.post).toHaveBeenCalledWith('/notifications/register-token', {
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    });
  });

  it('unregisters a push token', async () => {
    mockedApi.delete.mockResolvedValue({});
    await unregisterToken('ExponentPushToken[abc]');
    expect(mockedApi.delete).toHaveBeenCalledWith('/notifications/register-token', {
      data: { token: 'ExponentPushToken[abc]' },
    });
  });
});
