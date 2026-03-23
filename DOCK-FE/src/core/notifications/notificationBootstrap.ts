//알림 진입점들을 한 곳에서 묶음
//처리하는 것 : foreground 메세지 수신 / background 알림 클릭 / quit 상태 초기 알림 진입 

import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { enqueueNotificationOpen } from './notificationQueue';
import { toNotificationMessage, toNotificationOpenEvent } from './notificationGateway';
import type { NotificationMessage, NotificationOpenEvent } from './notificationTypes';

export interface NotificationBootstrapOptions {
  onForegroundMessage?: (message: NotificationMessage) => void | Promise<void>;
  onNotificationOpen?: (event: NotificationOpenEvent) => void | Promise<void>;
}

export type NotificationBootstrapCleanup = () => void;

// background / quit 상태에서 열린 알림은 공통 이벤트로 변환해 큐에 적재하고 후속 핸들러에 전달한다.
const dispatchNotificationOpen = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage | null,
  source: NotificationOpenEvent['source'],
  handler?: (event: NotificationOpenEvent) => void | Promise<void>,
): Promise<void> => {
  if (remoteMessage == null) {
    return;
  }

  const event = toNotificationOpenEvent(remoteMessage, source);
  enqueueNotificationOpen(event);

  if (handler != null) {
    await handler(event);
  }
};

export const bootstrapNotifications = async (
  options: NotificationBootstrapOptions,
): Promise<NotificationBootstrapCleanup> => {
  // 앱이 살아있는 동안 도착한 foreground 메시지를 구독한다.
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    if (options.onForegroundMessage == null) {
      return;
    }

    await options.onForegroundMessage(toNotificationMessage(remoteMessage));
  });

  // 앱이 background 상태였다가 알림 탭으로 돌아온 경우를 처리한다.
  const unsubscribeNotificationOpen = messaging().onNotificationOpenedApp(
    async (remoteMessage) => {
      await dispatchNotificationOpen(
        remoteMessage,
        'background_notification_press',
        options.onNotificationOpen,
      );
    },
  );

  // 앱이 종료된 상태에서 알림 탭으로 처음 실행된 경우를 처리한다.
  const initialMessage = await messaging().getInitialNotification();
  await dispatchNotificationOpen(
    initialMessage,
    'quit_notification_press',
    options.onNotificationOpen,
  );

  // App.tsx에서 effect cleanup 시 리스너 정리를 재사용할 수 있게 함수로 반환한다.
  return () => {
    unsubscribeForeground();
    unsubscribeNotificationOpen();
  };
};
