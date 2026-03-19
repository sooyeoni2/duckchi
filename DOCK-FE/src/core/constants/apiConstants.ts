import Constants from 'expo-constants';

export const API_BASE_URL = 'http://192.168.0.13:8081';
export const API_TIMEOUT = 10000;

export const ENDPOINTS = {
  auth: {
    kakaoLogin: '/api/v1/auth/oauth/login',
    profileSetup: '/api/v1/auth/profile/nickname',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
  },
};

const expoConfig = Constants.expoConfig ?? (Constants as any).manifest ?? {};
const extra = expoConfig?.extra ?? {};

export const KAKAO_CLIENT_ID: string = extra.kakaoClientId ?? '';
export const KAKAO_WEB_REDIRECT_URI: string = extra.kakaoRedirectUri ?? '';

export const KAKAO_WEB_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
  KAKAO_WEB_REDIRECT_URI,
)}&response_type=code`;
