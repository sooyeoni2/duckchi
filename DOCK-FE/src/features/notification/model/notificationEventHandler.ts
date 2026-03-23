// Notifee 알림 본문 클릭, 액션 버튼 클릭 이벤트를 처리

import { EventType, type EventDetail } from '@notifee/react-native';
import { enqueueNotificationOpen, type NotificationMessage } from '@core/notifications';
import {
  getForegroundNotificationActions,
  getNotificationNavigationTarget,
  openNotificationAction,
  openNotificationMessage,
} from './notificationNavigation';

const restoreMessageFromDetail = (detail: EventDetail): NotificationMessage | null => {
  const data = detail.notification?.data;

  if (data == null) {
    return null;
  }

  const { __title, __body, ...payloadData } = data;

  return {
    title: typeof __title === 'string' ? __title : detail.notification?.title,
    body: typeof __body === 'string' ? __body : detail.notification?.body,
    data: Object.entries(payloadData).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }

      return acc;
    }, {}),
  };
};

// Notifee 액션/알림 클릭 이벤트를 기존 알림 라우팅 로직에 연결한다.
export const handleDisplayedNotificationEvent = (
  type: EventType,
  detail: EventDetail,
): boolean => {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
    return false;
  }

  const message = restoreMessageFromDetail(detail);

  if (message == null) {
    return false;
  }

  const pressActionId = detail.pressAction?.id;

  if (pressActionId == null || pressActionId === 'OPEN_DEFAULT_DESTINATION') {
    const handled = openNotificationMessage(message);

    if (!handled) {
      enqueueNotificationOpen({
        source: 'background_notification_press',
        message,
        receivedAt: Date.now(),
      });
    }

    return handled;
  }

  const actions = getForegroundNotificationActions(message);
  const matchedAction = actions.find((action) => action.id === pressActionId);

  if (matchedAction != null) {
    const handled = openNotificationAction(matchedAction);

    if (!handled) {
      enqueueNotificationOpen({
        source: 'background_notification_press',
        message,
        receivedAt: Date.now(),
      });
    }

    return handled;
  }

  const fallbackTarget = getNotificationNavigationTarget(message);

  if (fallbackTarget == null) {
    return false;
  }

  const handled = openNotificationMessage(message);

  if (!handled) {
    enqueueNotificationOpen({
      source: 'background_notification_press',
      message,
      receivedAt: Date.now(),
    });
  }

  return handled;
};
