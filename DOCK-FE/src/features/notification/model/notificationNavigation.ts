// route mapper 결과를 실제 React navigation action으로 실행

import { CommonActions } from '@react-navigation/native';
import type { NotificationMessage, NotificationOpenEvent } from '@core/notifications';
import { navigationRef } from '@core/navigation/navigationRef';
import { getNotificationActions, mapNotificationToRoute } from './notificationRouteMapper';
import { parseNotificationMessage } from './notificationPayloadParser';
import type {
  AppNotification,
  NotificationAction,
  NotificationNavigationTarget,
} from './notificationTypes';

// 목적지 타입에 따라 React Navigation action을 공통 형태로 만든다.
const buildNavigationAction = (target: NotificationNavigationTarget) => {
  if (target.kind === 'home') {
    return CommonActions.navigate({
      name: target.rootScreen,
      params: {
        screen: target.tabScreen,
      },
    });
  }

  return CommonActions.navigate({
    name: target.rootScreen,
    params: {
      screen: target.tabScreen,
      params: {
        screen: target.nestedScreen,
        params: target.params,
      },
    },
  });
};

export const getAppNotification = (
  message: NotificationMessage,
): AppNotification | null => parseNotificationMessage(message);

export const getNotificationNavigationTarget = (
  message: NotificationMessage,
): NotificationNavigationTarget | null => {
  const notification = parseNotificationMessage(message);

  if (notification == null) {
    return null;
  }

  return mapNotificationToRoute(notification);
};

export const getForegroundNotificationActions = (
  message: NotificationMessage,
): NotificationAction[] => {
  const notification = parseNotificationMessage(message);

  if (notification == null) {
    return [];
  }

  return getNotificationActions(notification);
};

// foreground/background/quit 어디서 들어오든 같은 실행기로 목적지 화면 이동을 처리한다.
export const openNotificationTarget = (
  target: NotificationNavigationTarget,
): boolean => {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(buildNavigationAction(target));
  return true;
};

export const openNotificationAction = (
  action: NotificationAction,
): boolean => openNotificationTarget(action.target);

export const openNotificationMessage = (
  message: NotificationMessage,
): boolean => {
  const target = getNotificationNavigationTarget(message);

  if (target == null) {
    return false;
  }

  return openNotificationTarget(target);
};

// 알림 열림 이벤트도 message 단위 실행기로 바로 연결할 수 있게 감싼다.
export const openNotificationEvent = (
  event: NotificationOpenEvent,
): boolean => openNotificationMessage(event.message);
