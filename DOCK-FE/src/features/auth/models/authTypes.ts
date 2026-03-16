/* AUTH-01 카카오 OAuth 로그인 */

export interface KakaoLoginRequest {
  authorizationCode: string;
  email?: string;
}

export interface AuthUser {
  userId: number;
  name: string;
  tag: string;
}

export interface KakaoLoginResponse {
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
