export const API_BASE_URL = 'http://10.0.2.2:8080'; // Android 에뮬레이터 → localhost
export const API_TIMEOUT = 10000;

export const ENDPOINTS = {
  auth: {
    kakaoLogin: '/api/v1/auth/oauth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
  },
};

export const KAKAO_CLIENT_ID = 'a481698fa0191feaa7f9baf1fad1d5da';
export const KAKAO_REDIRECT_URI = 'http://localhost:8081/api/v1/auth/oauth/login';
export const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
