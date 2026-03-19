import React, {
  createContext, useContext, useState, useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';
import { registerForPushNotifications } from '../services/notifications';

// ── Types ─────────────────────────────────────────────────────

export type AuthUser = {
  id: number;
  email: string;
  fullName?: string;
  name?: string;
  isAdmin?: boolean;
};

export type AuthState = 'loading' | 'guest' | 'authenticated';

interface AuthContextValue {
  user: AuthUser | null;
  authState: AuthState;
  accessToken: string | null;
  /** @deprecated use authState === 'loading' */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string, tokenType?: string) => Promise<void>;
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
  const [authState,   setAuthState]   = useState<AuthState>('loading');

  const _applyTokens = useCallback(async (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY,  data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setAuthState('authenticated');
    // Register FCM token after successful auth (fire-and-forget)
    registerForPushNotifications().catch(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    await _applyTokens(data);
  }, [_applyTokens]);

  const loginWithGoogle = useCallback(async (token: string, tokenType = 'id_token') => {
    const data = await authApi.loginWithGoogle(token, tokenType);
    await _applyTokens(data);
  }, [_applyTokens]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
    setAuthState('guest');
  }, []);

  const restoreSession = useCallback(async () => {
    setAuthState('loading');
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (!token) { setAuthState('guest'); return; }
      setAccessToken(token);
      const me = await authApi.getMe();
      setUser(me);
      setAuthState('authenticated');
      registerForPushNotifications().catch(() => {});
    } catch {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      setUser(null);
      setAccessToken(null);
      setAuthState('guest');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, authState, accessToken,
      isLoading: authState === 'loading',
      login, loginWithGoogle, logout, restoreSession,
    }}>
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
