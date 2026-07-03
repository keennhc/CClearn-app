import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { AuthProfile } from '../types/user';
import { LoginDto, RegisterDto } from '../types/auth';
import * as authService from '../services/auth';
import * as notificationsService from '../services/notifications';
import { registerForPushNotifications } from '../utils/notifications';
import { promptBiometric } from '../utils/biometrics';
import { tokenStorage, biometricPreference } from '../utils/storage';
import { setLogoutCallback } from '../services/api';

interface AuthState {
  user: AuthProfile | null;
  token: string | null;
  isLoading: boolean;
  isLocked: boolean;
  activeCommunityId: string | null;
  setActiveCommunity: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  refreshProfile: () => Promise<void>;
  unlock: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const pushTokenRef = useRef<string | null>(null);
  const userRef = useRef<AuthProfile | null>(null);
  userRef.current = user;

  // Fire-and-forget: permission denial or a network failure here must never
  // block login/register/session-restore.
  const syncPushToken = useCallback(async () => {
    try {
      const registration = await registerForPushNotifications();
      if (registration) {
        await notificationsService.registerToken(registration.token, registration.platform);
        pushTokenRef.current = registration.token;
      }
    } catch {
      // ignore -- push notifications are a nice-to-have, not required for auth
    }
  }, []);

  const logout = useCallback(async () => {
    const pushToken = pushTokenRef.current;
    pushTokenRef.current = null;
    if (pushToken) {
      notificationsService.unregisterToken(pushToken).catch(() => {});
    }
    await tokenStorage.remove();
    setToken(null);
    setUser(null);
    setActiveCommunityId(null);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(async () => {
    const success = await promptBiometric();
    if (success) setIsLocked(false);
    return success;
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await tokenStorage.get();
        if (storedToken) {
          setToken(storedToken);
          const profile = await authService.getProfile();
          setUser(profile);
          if (profile.communities.length > 0) {
            setActiveCommunityId(profile.communities[0].communityId);
          }
          if (await biometricPreference.get()) {
            setIsLocked(true);
          }
          void syncPushToken();
        }
      } catch {
        await tokenStorage.remove();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [syncPushToken]);

  // Re-lock whenever the app returns from the background, so a picked-up
  // unlocked phone doesn't leave community chat/announcements exposed.
  useEffect(() => {
    let previousState = AppState.currentState ?? 'active';
    const subscription = AppState.addEventListener('change', (nextState) => {
      const cameToForeground = /inactive|background/.test(previousState) && nextState === 'active';
      previousState = nextState;
      if (!cameToForeground || !userRef.current) return;

      biometricPreference.get().then((enabled) => {
        if (enabled) setIsLocked(true);
      });
    });
    return () => subscription.remove();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken } = await authService.login({ email, password });
    await tokenStorage.set(accessToken);
    setToken(accessToken);
    const profile = await authService.getProfile();
    setUser(profile);
    if (profile.communities.length > 0) {
      setActiveCommunityId(profile.communities[0].communityId);
    }
    void syncPushToken();
  };

  const register = async (data: RegisterDto) => {
    const { accessToken } = await authService.register(data);
    await tokenStorage.set(accessToken);
    setToken(accessToken);
    const profile = await authService.getProfile();
    setUser(profile);
    void syncPushToken();
  };

  const setActiveCommunity = (id: string) => {
    setActiveCommunityId(id);
  };

  const refreshProfile = async () => {
    const profile = await authService.getProfile();
    setUser(profile);
    if (!activeCommunityId && profile.communities.length > 0) {
      setActiveCommunityId(profile.communities[0].communityId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLocked,
        activeCommunityId,
        setActiveCommunity,
        login,
        register,
        refreshProfile,
        unlock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
