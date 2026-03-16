import { axiosClient } from '@core/network/axiosClient';
import { ENDPOINTS } from '@core/constants/apiConstants';
import type { KakaoLoginRequest, KakaoLoginResponse } from './authTypes';

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
