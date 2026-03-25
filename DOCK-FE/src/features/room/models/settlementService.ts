import type { SettlementItem } from './settlementTypes';
import { ENDPOINTS } from '../../../core/constants/apiConstants';
import { axiosClient } from '../../../core/network/axiosClient';

const DEADLINE_HOURS = 48;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  msg?: string;
}

interface AutoDebitConsentResponseDto {
  roomId: number;
  userId: number;
  role: 'ADMIN' | 'MEMBER';
  isAgreed: boolean;
}

interface RoomMySetItemDto {
  settlementId: number;
  expenseId: number;
  title: string;
  requesterUserName: string;
  setUserCount: number;
  payableAmount: number;
  isCompleted: boolean;
  requestedAt: string;
}

interface RoomMySetResponseDto {
  myTotal: number;
  mySet: RoomMySetItemDto[];
  roomTotalAmount: number;
}

// 요청 시각 기준 48시간 정책을 UI 카운트다운 만료 시각으로 변환한다.
const toDeadlineIso = (requestedAt: string): string =>
  new Date(new Date(requestedAt).getTime() + DEADLINE_HOURS * 60 * 60 * 1000).toISOString();

const toSettlementItem = (dto: RoomMySetItemDto): SettlementItem => ({
  id: dto.settlementId,
  storeName: dto.title,
  requesterName: dto.requesterUserName,
  amount: dto.payableAmount,
  status: dto.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
  dueAt: toDeadlineIso(dto.requestedAt),
  paidAt: dto.isCompleted ? dto.requestedAt : undefined,
  paidCount: dto.isCompleted ? dto.setUserCount : 0,
  totalCount: dto.setUserCount,
});

export const fetchSettlementItems = async (roomId: number): Promise<SettlementItem[]> => {
  const response = await axiosClient.get<ApiEnvelope<RoomMySetResponseDto>>(
    ENDPOINTS.room.mySet(roomId),
  );

  if (response.data?.success !== true) {
    throw new Error(response.data?.msg ?? '정산 목록을 불러오지 못했습니다.');
  }

  const payload = response.data.data;
  return (payload?.mySet ?? [])
    .map(toSettlementItem)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
};

export const fetchAutoDebitConsent = async (roomId: number): Promise<boolean> => {
  // 송금 직전에는 로컬 캐시 대신 서버 상태를 기준으로 분기해야 동의 상태 불일치를 줄일 수 있다.
  const response = await axiosClient.get<ApiEnvelope<AutoDebitConsentResponseDto>>(
    ENDPOINTS.room.autoDebitConsents(roomId),
  );

  if (response.data?.success !== true) {
    throw new Error(response.data?.msg ?? '자동이체 동의 상태를 불러오지 못했습니다.');
  }

  return response.data.data.isAgreed === true;
};

export const transferSettlements = async (settlementIds: number[]): Promise<void> => {
  if (settlementIds.length === 0) {
    return;
  }

  await axiosClient.post('/api/v1/settlements/transfer', { settlementIds });
};
