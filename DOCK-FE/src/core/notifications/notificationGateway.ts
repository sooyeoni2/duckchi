import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import type { NotificationMessage, NotificationOpenEvent, NotificationOpenSource } from './notificationTypes';

// FCM data payload는 값 타입이 불안정할 수 있어서 문자열만 남겨 앱 내부 표준 형태로 정규화한다.
const normalizeNotificationData = (
  data: FirebaseMessagingTypes.RemoteMessage['data'],
): Record<string, string> => {
  if (data == null) {
    return {};
  }

  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }

    return acc;
  }, {});
};

// 원본 RemoteMessage를 앱 전역에서 재사용할 수 있는 NotificationMessage로 변환한다.
export const toNotificationMessage = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): NotificationMessage => ({
  messageId: remoteMessage.messageId,
  title: remoteMessage.notification?.title,
  body: remoteMessage.notification?.body,
  sentTime: remoteMessage.sentTime,
  data: normalizeNotificationData(remoteMessage.data),
});

// 알림 열림 이벤트는 메시지 내용과 진입 출처를 함께 기록해 후속 처리에 넘긴다.
export const toNotificationOpenEvent = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  source: NotificationOpenSource,
): NotificationOpenEvent => ({
  source,
  message: toNotificationMessage(remoteMessage),
  receivedAt: Date.now(),
});
