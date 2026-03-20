/* AUTH-01 카카오 OAuth 로그인 */

export interface KakaoLoginRequest {
  authorizationCode: string;
  redirectUri: string;
  email?: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  tag: string;
  profileImageUrl?: string;
  hasBankAccount?: boolean;
  hasPayPassword?: boolean;
}

/* AUTH-02 프로필 설정 */

export interface ProfileSetupRequest {
  name: string;
  profileImageKey: string;
}

export interface ProfileSetupResponse {
  userId: number;
  name: string;
  tag: string;
  profileImageUrl: string;
}

export interface KakaoLoginResponse {
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
