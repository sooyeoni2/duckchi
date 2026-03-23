import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/apiConstants';
import { getAccessToken } from './tokenManager';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 공통 클라이언트에서 access token을 자동으로 붙여 gateway 인증 흐름을 일관되게 맞춘다.
axiosClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  console.log('[API REQUEST]', config.method, `${config.baseURL}${config.url}`);
  console.log('[API AUTH]', !!config.headers.Authorization);

  return config;
});
