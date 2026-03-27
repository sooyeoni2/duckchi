// Notifee로 표시할 로컬 알림 payload를 생성

import type { NotificationPressAction } from '@notifee/react-native';
import notifee, { AndroidCategory, AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { DEFAULT_NOTIFICATION_CHANNEL_ID } from '@core/notifications';
import { getAppNotification } from './notificationNavigation';
import { getNotificationActions } from './notificationRouteMapper';
import type { AppNotification, NotificationAction } from './notificationTypes';
import type { NotificationMessage } from '@core/notifications';

const DEFAULT_PRESS_ACTION_ID = 'OPEN_DEFAULT_DESTINATION';

const toPressAction = (
  actionId: string,
): NotificationPressAction => ({
  id: actionId,
  launchActivity: 'default',
});

// Notifee에서 다시 앱 알림 타입을 복원할 수 있도록 원본 data와 제목/본문을 함께 보관한다.
const toNotificationData = (message: NotificationMessage): Record<string, string> => ({
  ...message.data,
  __title: message.title ?? '',
  __body: message.body ?? '',
});

const toAndroidActions = (actions: NotificationAction[]) =>
  actions.map((action) => ({
    title: action.label,
    pressAction: toPressAction(action.id),
  }));

// 앱 알림 타입에 맞춰 foreground 표시용 로컬 알림 payload를 만든다.
export const buildDisplayNotification = (
  message: NotificationMessage,
  notification: AppNotification,
) => {
  const actions = getNotificationActions(notification);
  const fallbackIdBase = `${message.data.type ?? 'unknown'}_${message.data.roomId ?? '0'}_${message.sentTime ?? 0}`;
  const notificationId = message.messageId ?? fallbackIdBase;

  return {
    id: notificationId,
    title: notification.title ?? '새 알림',
    body: notification.body ?? '도착한 알림을 확인해 주세요.',
    data: toNotificationData(message),
    android: {
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      pressAction: toPressAction(DEFAULT_PRESS_ACTION_ID),
      actions: toAndroidActions(actions),
      category: AndroidCategory.MESSAGE,
      importance: AndroidImportance.HIGH,
      style: notification.body
        ? {
            type: AndroidStyle.BIGTEXT as const,
            text: notification.body,
          }
        : undefined,
    },
  };
};

// foreground나 background data-only 메시지를 로컬 알림으로 띄울 때 사용한다.
export const displayNotificationMessage = async (
  message: NotificationMessage,
): Promise<boolean> => {
  console.log('[NOTI] displayNotificationMessage input', {
    title: message.title,
    body: message.body,
    data: message.data,
    messageId: message.messageId,
    sentTime: message.sentTime,
  });

  const notification = getAppNotification(message);

  if (notification == null) {
    console.warn('[NOTI] parse failed in displayNotificationMessage', {
      reason: 'getAppNotification returned null',
      data: message.data,
      title: message.title,
      body: message.body,
    });
    return false;
  }

  console.log('[NOTI] parse success in displayNotificationMessage', {
    type: notification.type,
    roomId: notification.roomId,
  });

  await notifee.displayNotification(buildDisplayNotification(message, notification));
  console.log('[NOTI] notifee.displayNotification success');
  return true;
};

export const getDefaultPressActionId = (): string => DEFAULT_PRESS_ACTION_ID;
