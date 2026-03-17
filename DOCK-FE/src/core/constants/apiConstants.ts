export const API_BASE_URL = 'http://10.0.2.2:8080'; // Android 에뮬레이터 → localhost
export const API_TIMEOUT = 10000;

export const ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/oauth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
};
