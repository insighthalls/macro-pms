/**
 * Auth store — Zustand, persists access+refresh tokens + user profile.
 * Wired to backend-slice /v1/auth/login for now.  Supabase Auth is the
 * Session-5 cutover target (see frontend/README.md).
 */

'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setToken } from './api';
import type { AuthResponse, User } from './types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      hydrate: () => {
        const t = get().accessToken;
        if (t) setToken(t);
      },
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await api.post<AuthResponse>('/auth/login', { email, password });
          setToken(res.accessToken);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: (e as Error).message || 'Sign-in failed' });
          throw e;
        }
      },
      logout: () => {
        setToken(null);
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'macro-pms-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);
