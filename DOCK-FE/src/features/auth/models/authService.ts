import { axiosClient } from '@core/network/axiosClient';
import { ENDPOINTS } from '@core/constants/apiConstants';
import type {
  KakaoLoginRequest,
  KakaoLoginResponse,
  ProfileImageUploadUrlRequest,
  ProfileImageUploadUrlResponse,
  ProfileSetupRequest,
  ProfileSetupResponse,
} from './authTypes';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const kakaoLogin = async (req: KakaoLoginRequest): Promise<KakaoLoginResponse> => {
  const { data } = await axiosClient.post<ApiResponse<KakaoLoginResponse>>(
    ENDPOINTS.auth.kakaoLogin,
    req,
  );
  return data.data ?? (data as unknown as KakaoLoginResponse);
};

export const createProfileImageUploadUrl = async (
  req: ProfileImageUploadUrlRequest,
): Promise<ProfileImageUploadUrlResponse> => {
  const { data } = await axiosClient.post<ApiResponse<ProfileImageUploadUrlResponse>>(
    ENDPOINTS.auth.profileImageUploadUrl,
    req,
  );
  return data.data;
};

export const uploadProfileImageToS3 = async (
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> => {
  const fileResponse = await fetch(fileUri);
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
  }
};

export const setupProfile = async (req: ProfileSetupRequest): Promise<ProfileSetupResponse> => {
  const { data } = await axiosClient.patch<ApiResponse<ProfileSetupResponse>>(
    ENDPOINTS.auth.profileSetup,
    req,
  );
  return data.data;
};

export const logout = async (): Promise<void> => {
  await axiosClient.post(ENDPOINTS.auth.logout);
};
