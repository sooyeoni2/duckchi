import { ENDPOINTS } from '@core/constants/apiConstants';
import { axiosClient } from '@core/network/axiosClient';

import type {
  SettlementParticipantItem,
  SettlementRequestListData,
  SettlementViewerRole,
} from './settlementRequestListTypes';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  msg?: string;
}

interface PendingSettlementItemDto {
  settlementId: number;
  payerUserId: number;
  payerUserName: string;
  payableAmount: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  completedAt: string | null;
}

interface PendingSettlementDto {
  expenseId: number;
  roomId: number;
  roomName: string;
  requesterUserId: number;
  requesterUserName: string;
  totalPayableAmount: number;
  pendingCount: number;
  completedCount: number;
  settlements: PendingSettlementItemDto[];
}

interface ManualTransferResultDto {
  settlementId: number;
  expenseId: number;
  settlementStatus: 'COMPLETED' | 'PENDING';
  expenseStatus: string;
  completedAt: string;
}

interface FetchSettlementRequestListParams {
  expenseId: number;
  roomId: number;
  expenseTitle?: string;
  currentUserId: number | null;
}

const buildJoinedSummary = (pendingCount: number, completedCount: number): string => {
  const totalCount = pendingCount + completedCount;
  if (totalCount <= 0) {
    return '참여자 정보가 없습니다.';
  }
  return `${completedCount}/${totalCount} · ${totalCount}명 참여`;
};

const toViewerRole = (
  requesterUserId: number,
  currentUserId: number | null,
): SettlementViewerRole => {
  if (currentUserId != null && requesterUserId === currentUserId) {
    return 'TREASURER';
  }
  return 'MEMBER';
};

const toParticipantItem = (
  settlement: PendingSettlementItemDto,
  currentUserId: number | null,
): SettlementParticipantItem => ({
  id: settlement.settlementId,
  userId: settlement.payerUserId,
  name: settlement.payerUserName,
  amount: settlement.payableAmount,
  isMe: currentUserId != null && settlement.payerUserId === currentUserId,
  status: settlement.status,
});

const unwrapOrThrow = <T>(response: ApiEnvelope<T>, fallbackMessage: string): T => {
  if (response.success !== true) {
    throw new Error(response.msg ?? fallbackMessage);
  }
  return response.data;
};

export const fetchSettlementRequestList = async ({
  expenseId,
  roomId,
  expenseTitle,
  currentUserId,
}: FetchSettlementRequestListParams): Promise<SettlementRequestListData> => {
  const response = await axiosClient.get<ApiEnvelope<PendingSettlementDto>>(
    ENDPOINTS.settlement.pendingSettlements,
    {
      params: { expenseId },
    },
  );

  const payload = unwrapOrThrow(
    response.data,
    '정산 요청 목록을 불러오지 못했습니다.',
  );

  const participants = (payload.settlements ?? []).map((settlement) =>
    toParticipantItem(settlement, currentUserId),
  );
  const myAmount = participants.find((participant) => participant.isMe === true)?.amount ?? 0;

  return {
    roomId: payload.roomId ?? roomId,
    expenseId: payload.expenseId ?? expenseId,
    viewerRole: toViewerRole(payload.requesterUserId, currentUserId),
    requesterName: payload.requesterUserName,
    storeName: expenseTitle?.trim() ? expenseTitle : payload.roomName,
    totalAmount: payload.totalPayableAmount ?? 0,
    joinedSummary: buildJoinedSummary(payload.pendingCount, payload.completedCount),
    myAmount,
    participants,
  };
};

export const completeSettlementManually = async (
  settlementId: number,
): Promise<string | undefined> => {
  const response = await axiosClient.post<ApiEnvelope<ManualTransferResultDto>>(
    ENDPOINTS.settlement.manualTransfer,
    { settlementId },
  );

  if (response.data?.success !== true) {
    throw new Error(response.data?.msg ?? '직접 완료 처리에 실패했습니다.');
  }

  return response.data.msg;
};
