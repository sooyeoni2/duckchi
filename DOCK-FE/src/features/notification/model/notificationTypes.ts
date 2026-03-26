//앱이 타입들의 정의

import type { NotificationMessage } from '@core/notifications';

//알림 타입 정의
export type AppNotificationType =
  | 'SETTLEMENT_REQUEST_REMINDER'
  | 'SETTLEMENT_REQUEST_AUTO_TRANSFER'
  | 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER'
  | 'SETTLEMENT_COMPLETED'
  | 'ROOM_LIFECYCLE'
  | 'N_BBANG_RESULT';

//알림 이동 목적지 타입 정의
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

// 정산 요청 알림 - 자동이체
export interface SettlementRequestAutoTransferNotification
  extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST_AUTO_TRANSFER';
  settlementRequestId: number;
  totalAmount?: number;
  requestSummary?: string;
}

// 정산 요청 알림 - 원클릭 이체
export interface SettlementRequestOneClickTransferNotification
  extends AppNotificationBase {
  type: 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER';
  settlementRequestId: number;
}

// 정산 완료 알림
export interface SettlementCompletedNotification extends AppNotificationBase {
  type: 'SETTLEMENT_COMPLETED';
  settlementRequestId?: number;
}

// 모임 시작,완료 알림
export interface RoomLifecycleNotification extends AppNotificationBase {
  type: 'ROOM_LIFECYCLE';
  eventType: 'ROOM_STARTED' | 'ROOM_ENDED';
  roomName?: string;
}

// N빵 알림
export interface NBbangResultNotification extends AppNotificationBase {
  type: 'N_BBANG_RESULT';
  selectedParticipantNames: string[];
}

export type AppNotification =
  | SettlementRequestReminderNotification
  | SettlementRequestAutoTransferNotification
  | SettlementRequestOneClickTransferNotification
  | SettlementCompletedNotification
  | RoomLifecycleNotification
  | NBbangResultNotification;

// 네비게이션 스택 목적지
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
    };

// 알림액션 타입 정의
export interface NotificationAction {
  id:
    | 'OPEN_DEFAULT_DESTINATION'
    | 'VIEW_SETTLEMENT_DETAILS'
    | 'ACCEPT_AUTO_TRANSFER'
    | 'OPEN_ROOM_DETAIL';
  label: string;
  target: NotificationNavigationTarget;
}
