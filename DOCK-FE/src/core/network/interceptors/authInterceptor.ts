import type { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '../tokenManager';

export const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return config;
  }

  config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
};
