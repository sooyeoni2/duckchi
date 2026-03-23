import type { NotificationMessage } from '@core/notifications';
import type {
  AppNotification,
  MeetingStatusChangedNotification,
  NBbangResultNotification,
  NotificationTargetScreen,
  SettlementCompletedNotification,
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

const toOptionalMeetingStatus = (
  value: string | undefined,
): MeetingStatusChangedNotification['meetingStatus'] | null => {
  switch (value) {
    case 'STARTED':
    case 'ENDED':
      return value;
    default:
      return null;
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

// core에서 정규화한 메시지를 앱 알림 도메인 타입으로 안전하게 변환한다.
export const parseNotificationMessage = (
  message: NotificationMessage,
): AppNotification | null => {
  switch (message.data.type) {
    case 'SETTLEMENT_REQUEST_REMINDER':
      return parseSettlementRequestReminder(message);
    case 'SETTLEMENT_REQUEST_AUTO_TRANSFER':
      return parseSettlementRequestAutoTransfer(message);
    case 'SETTLEMENT_REQUEST_ONE_CLICK_TRANSFER':
      return parseSettlementRequestOneClickTransfer(message);
    case 'SETTLEMENT_COMPLETED':
      return parseSettlementCompleted(message);
    case 'MEETING_STATUS_CHANGED':
      return parseMeetingStatusChanged(message);
    case 'N_BBANG_RESULT':
      return parseNBbangResult(message);
    default:
      return null;
  }
};

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

const parseMeetingStatusChanged = (
  message: NotificationMessage,
): MeetingStatusChangedNotification | null => {
  const baseFields = getBaseFields(message);
  const meetingStatus = toOptionalMeetingStatus(message.data.meetingStatus);

  if (baseFields == null || meetingStatus == null) {
    return null;
  }

  return {
    type: 'MEETING_STATUS_CHANGED',
    ...baseFields,
    meetingStatus,
    roomName: message.data.roomName,
  };
};

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
