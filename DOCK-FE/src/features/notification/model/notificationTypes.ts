import type { NotificationMessage } from '@core/notifications';

export type AppNotificationType =
  | 'SETTLEMENT_REQUEST_REMINDER'
  | 'SETTLEMENT_REQUEST_AUTO_TRANSFER'
  | 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER'
  | 'SETTLEMENT_COMPLETED'
  | 'MEETING_STATUS_CHANGED'
  | 'N_BBANG_RESULT';

export type NotificationTargetScreen =
  | 'AUTO_TRANSFER_AGREE'
  | 'SETTLEMENT_REQUEST_LIST'
  | 'ROOM_DETAIL';

// 알림 원문을 유지해두면 foreground 표시나 추적 로그에서 재사용하기 쉽다.
export interface AppNotificationBase {
  type: AppNotificationType;
  title?: string;
  body?: string;
  rawMessage: NotificationMessage;
  roomId: number;
}

// 정산 요청 리마인드 알림은 방 식별자와 요청 식별자를 기반으로 이동 화면을 결정한다.
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

export interface MeetingStatusChangedNotification extends AppNotificationBase {
  type: 'MEETING_STATUS_CHANGED';
  meetingStatus: 'STARTED' | 'ENDED';
  roomName?: string;
}

export interface NBbangResultNotification extends AppNotificationBase {
  type: 'N_BBANG_RESULT';
  selectedParticipantNames: string[];
}

export type AppNotification =
  | SettlementRequestReminderNotification
  | SettlementRequestAutoTransferNotification
  | SettlementRequestOneClickTransferNotification
  | SettlementCompletedNotification
  | MeetingStatusChangedNotification
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
