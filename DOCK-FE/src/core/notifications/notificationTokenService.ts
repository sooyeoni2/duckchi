import messaging from '@react-native-firebase/messaging';
import { axiosClient } from '@core/network/axiosClient';
import { ENDPOINTS } from '@core/constants/apiConstants';

export interface RegisterNotificationTokenRequest {
  deviceId: string;
  token: string;
  notificationEnabled?: boolean;
}

interface NotificationTokenResponse {
  id: number;
  deviceId: string;
  notificationEnabled: boolean;
  is_active: boolean;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg?: string;
}

export const getCurrentFcmToken = async (): Promise<string> => messaging().getToken();

// 토큰 등록 API는 현재 백엔드 스펙상 X-User-Id 헤더를 함께 받아야 한다.
export const registerNotificationToken = async (
  request: RegisterNotificationTokenRequest,
): Promise<NotificationTokenResponse> => {
  console.log('[FCM REGISTER] request payload', {
    tokenLength: request.token.length,
    notificationEnabled: request.notificationEnabled ?? true,
  });

  const { data } = await axiosClient.post<ApiResponse<NotificationTokenResponse>>(
    ENDPOINTS.notifications.token,
    request,
  );

  console.log('[FCM REGISTER] response payload', data);

  return data.data;
};
