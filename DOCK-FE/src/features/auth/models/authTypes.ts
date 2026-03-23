/* AUTH-01 Kakao OAuth Login */

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

/* AUTH-02 Profile Setup */

export interface ProfileImageUploadUrlRequest {
  fileName: string;
  contentType: string;
}

export interface ProfileImageUploadUrlResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
}

export interface ProfileSetupRequest {
  name: string;
  profileImageKey?: string;
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
