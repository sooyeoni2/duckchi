import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, ENDPOINTS } from '../../constants/apiConstants';
import { resetToAuth } from '../../navigation/navigationRef';
import { useAuthStore } from '../../../features/auth/models/authStore';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface RefreshTokenResponse {
  accessToken: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return true;
  }

  return url.includes(ENDPOINTS.auth.kakaoLogin)
    || url.includes(ENDPOINTS.auth.refresh);
};

const handleSessionExpired = () => {
  useAuthStore.getState().clear();
  resetToAuth();
};

const requestAccessTokenRefresh = async () => {
  const { refreshToken, updateAccessToken } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('Refresh token is missing.');
  }

  const { data } = await refreshClient.post<ApiResponse<RefreshTokenResponse>>(
    ENDPOINTS.auth.refresh,
    { refreshToken },
  );

  const nextAccessToken = data.data.accessToken;
  updateAccessToken(nextAccessToken);
  return nextAccessToken;
};

export const createAuthErrorHandler = (client: AxiosInstance) =>
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = requestAccessTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${nextAccessToken}`);
      return client(originalRequest);
    } catch (refreshError) {
      handleSessionExpired();
      return Promise.reject(refreshError);
    }
  };
