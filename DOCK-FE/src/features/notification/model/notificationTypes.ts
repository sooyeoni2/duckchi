import type { NotificationMessage } from '@core/notifications';

export type AppNotificationType =
  | 'SETTLEMENT_REQUEST'
  | 'SETTLEMENT_REQUEST_REMINDER'
  | 'SETTLEMENT_REQUEST_AUTO_TRANSFER'
  | 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER'
  | 'SETTLEMENT_COMPLETED'
  | 'ROOM_LIFECYCLE'
  | 'N_BBANG_RESULT';

export type NotificationTargetScreen =
  | 'AUTO_TRANSFER_AGREE'
  | 'SETTLEMENT_REQUEST_LIST'
  | 'ROOM_DETAIL';

export interface AppNotificationBase {
  type: AppNotificationType;
  title?: string;
  body?: string;
  rawMessage: NotificationMessage;
  roomId: number;
}

export interface SettlementRequestNotification extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST';
  isAgreed: boolean;
  settlementIds?: number[];
}

export interface SettlementRequestReminderNotification
  extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST_REMINDER';
  settlementRequestId: number;
  remindAfterHours: number;
  targetScreen?: NotificationTargetScreen;
}

export interface SettlementRequestAutoTransferNotification
  extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST_AUTO_TRANSFER';
  settlementRequestId: number;
  totalAmount?: number;
  requestSummary?: string;
}

export interface SettlementRequestOneClickTransferNotification
  extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER';
  settlementRequestId: number;
}

export interface SettlementCompletedNotification extends AppNotificationBase {
  type: 'SETTLEMENT_COMPLETED';
  settlementRequestId?: number;
}

export interface RoomLifecycleNotification extends AppNotificationBase {
  type: 'ROOM_LIFECYCLE';
  eventType: 'ROOM_STARTED' | 'ROOM_ENDED';
  roomName?: string;
}

export interface NBbangResultNotification extends AppNotificationBase {
  type: 'N_BBANG_RESULT';
  selectedParticipantNames: string[];
}

export type AppNotification =
  | SettlementRequestNotification
  | SettlementRequestReminderNotification
  | SettlementRequestAutoTransferNotification
  | SettlementRequestOneClickTransferNotification
  | SettlementCompletedNotification
  | RoomLifecycleNotification
  | NBbangResultNotification;

export type NotificationNavigationTarget =
  | {
      kind: 'home';
      rootScreen: 'App';
      tabScreen: 'Home';
    }
  | {
      kind: 'room';
      rootScreen: 'App';
      tabScreen: 'Room';
      nestedScreen: 'RoomDetail';
      params: {
        roomId: number;
        showTransfer?: boolean;
        initialTab?: 'PAYMENT' | 'SETTLEMENT' | 'RANKING';
      };
    }
  | {
      kind: 'room';
      rootScreen: 'App';
      tabScreen: 'Room';
      nestedScreen: 'AutoTransferAgree';
      params: {
        roomId: number;
      };
    }
  | {
      kind: 'room';
      rootScreen: 'App';
      tabScreen: 'Room';
      nestedScreen: 'SettlementRequestList';
      params: {
        roomId: number;
      };
    }
  | {
      kind: 'room';
      rootScreen: 'App';
      tabScreen: 'Room';
      nestedScreen: 'PaymentList';
      params: {
        roomId: number;
      };
    }
  | {
      kind: 'room';
      rootScreen: 'App';
      tabScreen: 'Room';
      nestedScreen: 'SettlementTransferAction';
      params: {
        roomId: number;
        settlementIds: number[];
      };
    };

export interface NotificationAction {
  id:
    | 'OPEN_DEFAULT_DESTINATION'
    | 'VIEW_SETTLEMENT_DETAILS'
    | 'ACCEPT_AUTO_TRANSFER'
    | 'OPEN_ROOM_DETAIL';
  label: string;
  target: NotificationNavigationTarget;
}

