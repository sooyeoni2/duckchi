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

const getSettlementTransferActionDestination = (
  roomId: number,
  settlementIds: number[],
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'SettlementTransferAction',
  params: {
    roomId,
    settlementIds,
  },
});

const getSettlementRequestDestination = (
  roomId: number,
  isAgreed: boolean,
): NotificationNavigationTarget => {
  if (isAgreed) {
    return getSettlementRequestListDestination(roomId);
  }

  return getTransferDestination(roomId);
};

const getRoomPaymentDestination = (
  roomId: number,
): NotificationNavigationTarget => ({
  kind: 'room',
  rootScreen: 'App',
  tabScreen: 'Room',
  nestedScreen: 'RoomDetail',
  params: {
    roomId,
    initialTab: 'PAYMENT',
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

export const mapNotificationToRoute = (
  notification: AppNotification,
): NotificationNavigationTarget | null => {
  switch (notification.type) {
    case 'SETTLEMENT_REQUEST':
      return getSettlementRequestDestination(notification.roomId, notification.isAgreed);
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
      return getRoomPaymentDestination(notification.roomId);
    case 'ROOM_LIFECYCLE':
      return getRoomDetailDestination(notification.roomId);
    case 'N_BBANG_RESULT':
      return getHomeDestination();
    default:
      return null;
  }
};

export const getNotificationActions = (
  notification: AppNotification,
): NotificationAction[] => {
  switch (notification.type) {
    case 'SETTLEMENT_REQUEST':
      if (notification.isAgreed && (notification.settlementIds?.length ?? 0) > 0) {
        return [
          {
            id: 'ACCEPT_AUTO_TRANSFER',
            label: '수락',
            target: getSettlementTransferActionDestination(
              notification.roomId,
              notification.settlementIds ?? [],
            ),
          },
          {
            id: 'VIEW_SETTLEMENT_DETAILS',
            label: '내역',
            target: getTransferDestination(notification.roomId),
          },
        ];
      }

      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '열기',
          target: getSettlementRequestDestination(notification.roomId, notification.isAgreed),
        },
      ];
    case 'SETTLEMENT_REQUEST_AUTO_TRANSFER':
      return [
        {
          id: 'ACCEPT_AUTO_TRANSFER',
          label: '승인',
          target: getSettlementRequestListDestination(notification.roomId),
        },
        {
          id: 'VIEW_SETTLEMENT_DETAILS',
          label: '상세보기',
          target: getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_REQUEST_REMINDER':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '열기',
          target: mapNotificationToRoute(notification) ?? getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '열기',
          target: getTransferDestination(notification.roomId),
        },
      ];
    case 'SETTLEMENT_COMPLETED':
      return [
        {
          id: 'OPEN_ROOM_DETAIL',
          label: '정산내역 보기',
          target: getRoomPaymentDestination(notification.roomId),
        },
      ];
    case 'ROOM_LIFECYCLE':
      return [
        {
          id: 'OPEN_ROOM_DETAIL',
          label: '모임 보기',
          target: getRoomDetailDestination(notification.roomId),
        },
      ];
    case 'N_BBANG_RESULT':
      return [
        {
          id: 'OPEN_DEFAULT_DESTINATION',
          label: '모임 보기',
          target: getHomeDestination(),
        },
      ];
    default:
      return [];
  }
};
