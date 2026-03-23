import type { NotificationOpenEvent } from './notificationTypes';

// 네비게이션이 아직 준비되지 않았을 때 알림 열림 이벤트를 잠시 저장한다.
const pendingNotificationOpens: NotificationOpenEvent[] = [];

export const enqueueNotificationOpen = (event: NotificationOpenEvent): void => {
  pendingNotificationOpens.push(event);
};

// 단건 처리용으로 가장 먼저 들어온 이벤트부터 꺼낸다.
export const consumeNextNotificationOpen = (): NotificationOpenEvent | null =>
  pendingNotificationOpens.shift() ?? null;

// 앱 준비 후 한 번에 처리할 수 있도록 대기 중인 이벤트를 모두 꺼낸다.
export const consumeAllNotificationOpens = (): NotificationOpenEvent[] => {
  const events = [...pendingNotificationOpens];
  pendingNotificationOpens.length = 0;
  return events;
};

// 대기 중인 알림 열림 이벤트 존재 여부만 빠르게 확인할 때 사용한다.
export const hasPendingNotificationOpen = (): boolean =>
  pendingNotificationOpens.length > 0;
