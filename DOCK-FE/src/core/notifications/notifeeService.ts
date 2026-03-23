//알림 표시 전에 필요한 공통 준비 작업 담당

import notifee, { AndroidImportance } from '@notifee/react-native';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

// 앱에서 공통으로 사용할 기본 채널을 미리 생성한다.
export const ensureDefaultNotificationChannel = async (): Promise<string> =>
  notifee.createChannel({
    id: DEFAULT_NOTIFICATION_CHANNEL_ID,
    name: '기본 알림',
    importance: AndroidImportance.HIGH,
  });

// iOS/Android 공통 알림 권한 요청을 한 곳에서 처리한다.
export const requestNotificationDisplayPermission = async (): Promise<void> => {
  await notifee.requestPermission();
};
