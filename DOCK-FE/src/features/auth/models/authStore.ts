import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AuthUser } from './authTypes';
import { setAccessToken } from '@core/network/tokenManager';

const STORAGE_KEY = 'auth_refresh_token';
const STORAGE_USER_KEY = 'auth_user';

export const saveTokenToStorage = async (refreshToken: string, user: AuthUser) => {
  await AsyncStorage.multiSet([
    [STORAGE_KEY, refreshToken],
    [STORAGE_USER_KEY, JSON.stringify(user)],
  ]);
};

export const loadTokenFromStorage = async (): Promise<{ refreshToken: string; user: AuthUser } | null> => {
  const values = await AsyncStorage.multiGet([STORAGE_KEY, STORAGE_USER_KEY]);
  const refreshToken = values[0][1];
  const userStr = values[1][1];
  if (!refreshToken || !userStr) return null;
  return { refreshToken, user: JSON.parse(userStr) as AuthUser };
};

export const clearTokenFromStorage = async () => {
  await AsyncStorage.multiRemove([STORAGE_KEY, STORAGE_USER_KEY]);
};

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
    clearTokenFromStorage();
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false });
  },
}));
