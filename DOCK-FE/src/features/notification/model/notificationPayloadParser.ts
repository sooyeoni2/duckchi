import type { NotificationMessage } from '@core/notifications';
import type {
  AppNotification,
  NBbangResultNotification,
  NotificationTargetScreen,
  RoomLifecycleNotification,
  SettlementCompletedNotification,
  SettlementRequestNotification,
  SettlementRequestAutoTransferNotification,
  SettlementRequestOneClickTransferNotification,
  SettlementRequestReminderNotification,
} from './notificationTypes';

const toPositiveInteger = (value: string | undefined): number | null => {
  if (value == null || value.trim().length === 0) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const toOptionalPositiveInteger = (value: string | undefined): number | undefined => {
  const parsedValue = toPositiveInteger(value);
  return parsedValue ?? undefined;
};

const toOptionalBoolean = (value: string | undefined): boolean | undefined => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

const toOptionalPositiveIntegerArray = (value: string | undefined): number[] | undefined => {
  if (value == null || value.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const positiveIntegers = parsed
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);

    return positiveIntegers.length > 0 ? positiveIntegers : undefined;
  } catch {
    return undefined;
  }
};

const toOptionalTargetScreen = (
  value: string | undefined,
): NotificationTargetScreen | undefined => {
  switch (value) {
    case 'AUTO_TRANSFER_AGREE':
    case 'SETTLEMENT_REQUEST_LIST':
    case 'ROOM_DETAIL':
      return value;
    default:
      return undefined;
  }
};


const toNameList = (value: string | undefined): string[] => {
  if (value == null || value.trim().length === 0) {
    return [];
  }

  return value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
};

const getBaseFields = (
  message: NotificationMessage,
): { roomId: number; title?: string; body?: string; rawMessage: NotificationMessage } | null => {
  const roomId = toPositiveInteger(message.data.roomId);

  if (roomId == null) {
    return null;
  }

  return {
    roomId,
    title: message.title,
    body: message.body,
    rawMessage: message,
  };
};

// core에서 정규화한 메시지를 프론트 앱 알림 도메인 타입으로 안전하게 변환
export const parseNotificationMessage = (
  message: NotificationMessage,
): AppNotification | null => {
  switch (message.data.type) {
    case 'SETTLEMENT_REQUEST':
      return parseSettlementRequest(message);
    case 'SETTLEMENT_REQUEST_REMINDER':
      return parseSettlementRequestReminder(message);
    case 'SETTLEMENT_REQUEST_AUTO_TRANSFER':
      return parseSettlementRequestAutoTransfer(message);
    case 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER':
      return parseSettlementRequestOneClickTransfer(message);
    case 'SETTLEMENT_COMPLETED':
      return parseSettlementCompleted(message);
    case 'ROOM_LIFECYCLE':
      return parseRoomLifecycle(message);
    case 'N_BBANG_RESULT':
      return parseNBbangResult(message);
    default:
      return null;
  }
};

const parseSettlementRequest = (
  message: NotificationMessage,
): SettlementRequestNotification | null => {
  const baseFields = getBaseFields(message);
  const isAgreed = toOptionalBoolean(message.data.isAgreed);

  if (baseFields == null || isAgreed == null) {
    return null;
  }

  return {
    type: 'SETTLEMENT_REQUEST',
    ...baseFields,
    isAgreed,
    settlementIds: toOptionalPositiveIntegerArray(message.data.settlementIds),
  };
};

//스케줄링 기반 알림 메세지 파싱
const parseSettlementRequestReminder = (
  message: NotificationMessage,
): SettlementRequestReminderNotification | null => {
  const baseFields = getBaseFields(message);
  const settlementRequestId = toPositiveInteger(message.data.settlementRequestId);
  const remindAfterHours = toPositiveInteger(message.data.remindAfterHours);

  if (baseFields == null || settlementRequestId == null || remindAfterHours == null) {
    return null;
  }

  return {
    type: 'SETTLEMENT_REQUEST_REMINDER',
    ...baseFields,
    settlementRequestId,
    remindAfterHours,
    targetScreen: toOptionalTargetScreen(message.data.targetScreen),
  };
};
//정산 요청 알림 - 자동이체 동의자 메세지 파싱 
const parseSettlementRequestAutoTransfer = (
  message: NotificationMessage,
): SettlementRequestAutoTransferNotification | null => {
  const baseFields = getBaseFields(message);
  const settlementRequestId = toPositiveInteger(message.data.settlementRequestId);

  if (baseFields == null || settlementRequestId == null) {
    return null;
  }

  return {
    type: 'SETTLEMENT_REQUEST_AUTO_TRANSFER',
    ...baseFields,
    settlementRequestId,
    totalAmount: toOptionalPositiveInteger(message.data.totalAmount),
    requestSummary: message.data.requestSummary,
  };
};

//정산 요청 알림 - 자동이체 미동의자 메세지 파싱 
const parseSettlementRequestOneClickTransfer = (
  message: NotificationMessage,
): SettlementRequestOneClickTransferNotification | null => {
  const baseFields = getBaseFields(message);
  const settlementRequestId = toPositiveInteger(message.data.settlementRequestId);

  if (baseFields == null || settlementRequestId == null) {
    return null;
  }

  return {
    type: 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER',
    ...baseFields,
    settlementRequestId,
  };
};

//정산완료 알림 메세지 파싱
const parseSettlementCompleted = (
  message: NotificationMessage,
): SettlementCompletedNotification | null => {
  const baseFields = getBaseFields(message);

  if (baseFields == null) {
    return null;
  }

  return {
    type: 'SETTLEMENT_COMPLETED',
    ...baseFields,
    settlementRequestId: toOptionalPositiveInteger(message.data.settlementRequestId),
  };
};


// 모임방 시작,종료 타입 파싱
const parseRoomLifecycle = (
  message: NotificationMessage,
): RoomLifecycleNotification | null => {
  const baseFields = getBaseFields(message);

  if (baseFields == null) {
    return null;
  }

  const eventType = (() => {
    switch (message.data.eventType) {
      case 'ROOM_STARTED': //eventType이 모임방 시작인 경우 
        return 'ROOM_STARTED' as const;
      case 'ROOM_ENDED': //eventType이 모임방 종료인 경우
        return 'ROOM_ENDED' as const;
      default:
        return null;
    }
  })();

  if (eventType == null) {
    return null;
  }

  return {
    type: 'ROOM_LIFECYCLE',
    ...baseFields,
    eventType,
    roomName: message.data.roomName,
  };
};

// N빵룰렛 메세지 파싱
const parseNBbangResult = (
  message: NotificationMessage,
): NBbangResultNotification | null => {
  const baseFields = getBaseFields(message);

  if (baseFields == null) {
    return null;
  }

  return {
    type: 'N_BBANG_RESULT',
    ...baseFields,
    selectedParticipantNames: toNameList(message.data.selectedParticipantNames),
  };
};
