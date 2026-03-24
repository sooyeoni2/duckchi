import { create } from 'zustand';
import type { AuthUser } from './authTypes';
import { setAccessToken } from '@core/network/tokenManager';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  updateAccessToken: (accessToken: string) => void;
  setHasBankAccount: () => void;
  setHasPayPassword: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,
  setAuth: (accessToken, refreshToken, user) => {
    setAccessToken(accessToken);
    set({ accessToken, refreshToken, user, isLoggedIn: true });
  },
  updateAccessToken: (accessToken) => {
    setAccessToken(accessToken);
    set(state => ({ ...state, accessToken }));
  },
  setHasBankAccount: () =>
    set(state => ({
      user: state.user ? { ...state.user, hasBankAccount: true } : null,
    })),
  setHasPayPassword: () =>
    set(state => ({
      user: state.user ? { ...state.user, hasPayPassword: true } : null,
    })),
  clear: () => {
    setAccessToken(null);
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false });
  },
}));
