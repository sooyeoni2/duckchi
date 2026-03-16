import { create } from 'zustand';
import type { AuthUser } from './authTypes';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,
  setAuth: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user, isLoggedIn: true }),
  clear: () =>
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false }),
}));
