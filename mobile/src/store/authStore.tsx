/**
 * Auth store — React Context implementation.
 * Exposes the same interface as a Zustand store so consumers
 * just call useAuthStore() with no extra setup.
 */

import React, {
  createContext, useContext, useState, useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';

// ── Types ─────────────────────────────────────────────────────

export type AuthUser = {
  id: number;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
};

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  /** Sign in — stores tokens, sets user state. */
  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY,  data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  /** Sign out — clears SecureStore and resets state. */
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  /**
   * Called once on app start.
   * Reads stored token → fetches /auth/me to validate / restore user.
   * The axios interceptor in api/index.ts handles silent token refresh.
   */
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (!token) return;
      setAccessToken(token);
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      // Token invalid or refresh failed — clear everything
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, restoreSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useAuthStore(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used inside <AuthProvider>');
  return ctx;
}
