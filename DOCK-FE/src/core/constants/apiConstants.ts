import Constants from 'expo-constants';

export const API_BASE_URL = 'http://192.168.100.126:8081'; // Expo Go 실제 기기 (Wi-Fi IP)
export const API_TIMEOUT = 10000;

export const ENDPOINTS = {
  auth: {
    kakaoLogin: '/api/v1/auth/oauth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
  },
};

const extra = Constants.expoConfig?.extra ?? {};
const KAKAO_CLIENT_ID: string = extra.kakaoClientId ?? '';
const KAKAO_REDIRECT_URI: string = extra.kakaoRedirectUri ?? '';

export const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
