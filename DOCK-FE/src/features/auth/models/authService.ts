import { axiosClient } from '@core/network/axiosClient';
import { ENDPOINTS } from '@core/constants/apiConstants';
import type {
  KakaoLoginRequest,
  KakaoLoginResponse,
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
  return data.data;
};

export const setupProfile = async (req: ProfileSetupRequest): Promise<ProfileSetupResponse> => {
  const { data } = await axiosClient.patch<ApiResponse<ProfileSetupResponse>>(
    ENDPOINTS.auth.profileSetup,
    req,
  );
  return data.data;
};
