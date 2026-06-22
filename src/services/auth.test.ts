import { login, register, getProfile } from './auth';
import api from './api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('auth service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('posts credentials and returns the access token', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: true, data: { accessToken: 'jwt-123' } },
      });

      const result = await login({ email: 'test@test.com', password: 'pass' });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'pass',
      });
      expect(result).toEqual({ accessToken: 'jwt-123' });
    });
  });

  describe('register', () => {
    it('posts registration data and returns the access token', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: true, data: { accessToken: 'jwt-456' } },
      });

      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'pass',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'pass',
      });
      expect(result).toEqual({ accessToken: 'jwt-456' });
    });
  });

  describe('getProfile', () => {
    it('fetches the authenticated user profile', async () => {
      const profile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        role: 'USER',
        communities: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockedApi.get.mockResolvedValue({
        data: { success: true, data: profile },
      });

      const result = await getProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(profile);
    });
  });
});
