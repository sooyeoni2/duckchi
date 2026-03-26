// 파싱된 알림을 어떤 화면으로 보낼지 결정 

import type {
  AppNotification,
  NotificationAction,
  NotificationNavigationTarget,
} from './notificationTypes';

const getTransferDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'RoomDetail',
  params: {
    roomId,
    showTransfer: true,
  },
});

const getAutoTransferAgreeDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'AutoTransferAgree',
  params: {
    roomId,
  },
});

const getSettlementRequestListDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'SettlementRequestList',
  params: {
    roomId,
  },
});

const getPaymentListDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'PaymentList',
  params: {
    roomId,
  },
});

const getRoomDetailDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'RoomDetail',
  params: {
    roomId,
  },
});

const getHomeDestination = (): NotificationNavigationTarget => ({
  kind: 'home',
  rootScreen: 'App',
  tabScreen: 'Home',
});

// 알림 타입을 현재 앱 라우트 구조에 맞는 이동 정보로 변환한다.
export const mapNotificationToRoute = (
  notification: AppNotification,
): NotificationNavigationTarget | null => {
  switch (notification.type) {
    case 'SETTLEMENT_REQUEST_REMINDER':
      if (notification.targetScreen === 'AUTO_TRANSFER_AGREE') {
        return getAutoTransferAgreeDestination(notification.roomId);
      }

      return getTransferDestination(notification.roomId);
    case 'SETTLEMENT_REQUEST_AUTO_TRANSFER':
      return getSettlementRequestListDestination(notification.roomId);
    case 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER':
      return getTransferDestination(notification.roomId);
    case 'SETTLEMENT_COMPLETED':
      return getPaymentListDestination(notification.roomId);
    case 'ROOM_LIFECYCLE':
      return getRoomDetailDestination(notification.roomId);
    case 'N_BBANG_RESULT':
      return getHomeDestination();
    default:
      return null;
  }
};

// foreground 얼럿에서는 알림 타입에 따라 바로 실행 가능한 버튼 목록을 내려준다.
export const getNotificationActions = (
  notification: AppNotification,
): NotificationAction[] => {
  switch (notification.type) {
    case 'SETTLEMENT_REQUEST_AUTO_TRANSFER':
      return [
        {
          id: 'ACCEPT_AUTO_TRANSFER',
          label: '수락',
          target: getSettlementRequestListDestination(notification.roomId),
        },
        {
          id: 'VIEW_SETTLEMENT_DETAILS',
          label: '내역',
          target: getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_REQUEST_REMINDER':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '이동',
          target: mapNotificationToRoute(notification) ?? getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '이동',
          target: getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_COMPLETED':
      return [
        {
          id: 'OPEN_ROOM_DETAIL',
          label: '?ëº¤ì”¤',
          target: getPaymentListDestination(notification.roomId),
        },
      ];
    case 'ROOM_LIFECYCLE':
      return [
        {
          id: 'OPEN_ROOM_DETAIL',
          label: '확인',
          target: getRoomDetailDestination(notification.roomId),
        },
      ];
    case 'N_BBANG_RESULT':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '확인',
          target: getHomeDestination(),
        },
      ];
    default:
      return [];
  }
};
