import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthProfile } from '../types/user';
import { LoginDto, RegisterDto } from '../types/auth';
import * as authService from '../services/auth';
import { tokenStorage } from '../utils/storage';
import { setLogoutCallback } from '../services/api';

interface AuthState {
  user: AuthProfile | null;
  token: string | null;
  isLoading: boolean;
  activeCommunityId: string | null;
  setActiveCommunity: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);

  const logout = useCallback(async () => {
    await tokenStorage.remove();
    setToken(null);
    setUser(null);
    setActiveCommunityId(null);
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
        }
      } catch {
        await tokenStorage.remove();
      } finally {
        setIsLoading(false);
      }
    })();
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
  };

  const register = async (data: RegisterDto) => {
    const { accessToken } = await authService.register(data);
    await tokenStorage.set(accessToken);
    setToken(accessToken);
    const profile = await authService.getProfile();
    setUser(profile);
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
        activeCommunityId,
        setActiveCommunity,
        login,
        register,
        refreshProfile,
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
