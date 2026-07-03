import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '../services/auth';
import * as notificationsService from '../services/notifications';
import { registerForPushNotifications } from '../utils/notifications';
import { tokenStorage } from '../utils/storage';
import { AuthProfile } from '../types/user';

jest.mock('../services/auth');
jest.mock('../services/notifications');
jest.mock('../utils/notifications');
jest.mock('../utils/storage', () => ({
  tokenStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock('../services/api', () => ({ setLogoutCallback: jest.fn() }));

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedNotificationsService = notificationsService as jest.Mocked<typeof notificationsService>;
const mockedRegisterForPushNotifications = registerForPushNotifications as jest.Mock;
const mockedTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const mockProfile: AuthProfile = {
  id: 'u1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@test.com',
  role: 'USER',
  profileImageUrl: null,
  communities: [{ communityId: 'c1', communityName: 'Sunset HOA', role: 'COMMUNITY_MEMBER' }],
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRegisterForPushNotifications.mockResolvedValue(null);
  });

  describe('session restore', () => {
    it('finishes loading with no user when there is no stored token', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('restores the session and sets the first community as active when a valid token exists', async () => {
      mockedTokenStorage.get.mockResolvedValue('stored-token');
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual(mockProfile);
      expect(result.current.token).toBe('stored-token');
      expect(result.current.activeCommunityId).toBe('c1');
    });

    it('registers a push token after a successful restore', async () => {
      mockedTokenStorage.get.mockResolvedValue('stored-token');
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);
      mockedRegisterForPushNotifications.mockResolvedValue({ token: 'exp-token', platform: 'ios' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await waitFor(() =>
        expect(mockedNotificationsService.registerToken).toHaveBeenCalledWith('exp-token', 'ios'),
      );
    });

    it('clears the stored token when the restore fails (e.g. expired token)', async () => {
      mockedTokenStorage.get.mockResolvedValue('bad-token');
      mockedAuthService.getProfile.mockRejectedValue(new Error('401'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockedTokenStorage.remove).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('stores the token, populates the user, and sets the active community', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);
      mockedAuthService.login.mockResolvedValue({ accessToken: 'new-token' });
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('jane@test.com', 'password123');
      });

      expect(mockedTokenStorage.set).toHaveBeenCalledWith('new-token');
      expect(result.current.user).toEqual(mockProfile);
      expect(result.current.activeCommunityId).toBe('c1');
    });

    it('does not fail login when push registration throws', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);
      mockedAuthService.login.mockResolvedValue({ accessToken: 'new-token' });
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);
      mockedRegisterForPushNotifications.mockRejectedValue(new Error('permission API unavailable'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('jane@test.com', 'password123');
      });

      expect(result.current.user).toEqual(mockProfile);
    });
  });

  describe('logout', () => {
    it('clears user, token, and active community', async () => {
      mockedTokenStorage.get.mockResolvedValue('stored-token');
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedTokenStorage.remove).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.activeCommunityId).toBeNull();
    });

    it('unregisters the push token if one was registered during the session', async () => {
      mockedTokenStorage.get.mockResolvedValue('stored-token');
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);
      mockedRegisterForPushNotifications.mockResolvedValue({ token: 'exp-token', platform: 'android' });
      mockedNotificationsService.unregisterToken.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await waitFor(() => expect(mockedNotificationsService.registerToken).toHaveBeenCalled());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedNotificationsService.unregisterToken).toHaveBeenCalledWith('exp-token');
    });

    it('does not attempt to unregister when no push token was ever registered', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedNotificationsService.unregisterToken).not.toHaveBeenCalled();
    });
  });

  describe('setActiveCommunity', () => {
    it('updates the active community id', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setActiveCommunity('c2'));

      expect(result.current.activeCommunityId).toBe('c2');
    });
  });

  describe('refreshProfile', () => {
    it('refetches the profile and sets an active community if none is set yet', async () => {
      mockedTokenStorage.get.mockResolvedValue(null);
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(result.current.user).toEqual(mockProfile);
      expect(result.current.activeCommunityId).toBe('c1');
    });

    it('does not override an already-active community', async () => {
      mockedTokenStorage.get.mockResolvedValue('stored-token');
      mockedAuthService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.activeCommunityId).toBe('c1'));

      const secondCommunityProfile: AuthProfile = {
        ...mockProfile,
        communities: [{ communityId: 'c2', communityName: 'Oak Park', role: 'COMMUNITY_MEMBER' }],
      };
      mockedAuthService.getProfile.mockResolvedValue(secondCommunityProfile);

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(result.current.activeCommunityId).toBe('c1');
    });
  });
});
