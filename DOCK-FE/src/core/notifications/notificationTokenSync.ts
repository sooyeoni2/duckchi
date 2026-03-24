import { getOrCreateDeviceId } from './deviceId';
import { getCurrentFcmToken, registerNotificationToken } from './notificationTokenService';

// 로그인 직후 현재 기기의 FCM token 상태를 서버와 동기화한다.
export const syncNotificationToken = async (): Promise<void> => {
  console.log('[FCM SYNC] start', new Date().toISOString());

  const deviceId = await getOrCreateDeviceId();
  const token = await getCurrentFcmToken();

  console.log('[FCM SYNC] resolved device/token', {
    tokenLength: token.length,
  });

  await registerNotificationToken({
    deviceId,
    token,
    notificationEnabled: true,
  });

  console.log('[FCM SYNC] success');
};
