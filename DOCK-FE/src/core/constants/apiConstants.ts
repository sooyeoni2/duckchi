import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig ?? (Constants as any).manifest ?? {};
const extra = expoConfig?.extra ?? {};

export const API_BASE_URL = extra.apiBaseUrl ?? 'http://10.0.2.2:8080';
export const API_TIMEOUT = 10000;

export const ENDPOINTS = {
  auth: {
    kakaoLogin: '/api/v1/auth/oauth/login',
    profileImageUploadUrl: '/api/v1/auth/profile/image/upload-url',
    profileSetup: '/api/v1/auth/profile/nickname',
    logout: '/api/v1/auth/oauth/logout',
    refresh: '/api/v1/auth/token/refresh',
  },
  profiles: {
    editImage: '/api/v1/profiles/edit',
  },
  notifications: {
    token: '/api/v1/notifications/token',
  },
  payment: {
    // 결제안 목록 및 등록
    expenses: (roomId: number | string) => `/api/v1/rooms/${roomId}/expenses`,
    // 내 결제안 목록 조회
    myExpenses: (roomId: number | string) => `/api/v1/rooms/${roomId}/expenses/me`,
    // 결제안 상세 조회, 수정, 삭제
    expenseDetail: (roomId: number | string, expenseId: number | string) =>
      `/api/v1/rooms/${roomId}/expenses/${expenseId}`,
    // 정산 참여 가능 멤버 조회
    participants: (roomId: number | string) =>
      `/api/v1/rooms/${roomId}/expenses/participants`,
    // 계좌 거래 내역 조회 (PAY-01)
    accountHistory: '/api/v1/expenses/account-history',
    // OCR 영수증 분석 (PAY-03)
    ocr: '/api/v1/expenses/ocr',
  },
  room: {
    roomLists: '/api/v1/rooms/room-lists',
    mySet: (roomId: number | string) => `/api/v1/rooms/${roomId}/my-set`,
    autoDebitConsents: (roomId: number | string) =>
      `/api/v1/rooms/${roomId}/auto-debit/consents`,
  },
  insight: {
    monthlyCategories: '/api/v1/analytics/monthly/categories',
    monthlySummary: '/api/v1/analytics/monthly/summary',
    monthlyRoomsRanking: '/api/v1/analytics/monthly/rooms-ranking',
    trends: '/api/v1/analytics/trends',
  },
};

export const KAKAO_CLIENT_ID: string = extra.kakaoClientId ?? '';
export const KAKAO_WEB_REDIRECT_URI: string = extra.kakaoRedirectUri ?? '';

export const KAKAO_WEB_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_WEB_REDIRECT_URI)}&response_type=code`;
