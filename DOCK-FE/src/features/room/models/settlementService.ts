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
  isCompleted?: boolean;
  status?: string;
  requestedAt: string;
  completedAt?: string | null;
}

interface RoomMySetResponseDto {
  myTotal: number;
  mySet: RoomMySetItemDto[];
  roomTotalAmount: number;
}

// 요청 시각 기준 48시간 정책을 UI 카운트다운 만료 시각으로 변환한다.
const toDeadlineIso = (requestedAt: string): string =>
  new Date(new Date(requestedAt).getTime() + DEADLINE_HOURS * 60 * 60 * 1000).toISOString();

const isCompletedSettlement = (dto: RoomMySetItemDto): boolean =>
  dto.isCompleted === true || dto.status === 'COMPLETED';

const toSettlementItem = (dto: RoomMySetItemDto): SettlementItem => ({
  id: dto.settlementId,
  storeName: dto.title,
  requesterName: dto.requesterUserName,
  amount: dto.payableAmount,
  status: isCompletedSettlement(dto) ? 'COMPLETED' : 'IN_PROGRESS',
  dueAt: toDeadlineIso(dto.requestedAt),
  requestedAt: dto.requestedAt,
  // 완료 시각 필드가 없을 수 있어 요청 시각으로 폴백해 UI 완료 탭 시간 표기를 유지한다.
  paidAt: isCompletedSettlement(dto) ? dto.completedAt ?? dto.requestedAt : undefined,
  paidCount: isCompletedSettlement(dto) ? dto.setUserCount : 0,
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

export const transferSettlements = async (settlementIds: number[]): Promise<string | undefined> => {
  if (settlementIds.length === 0) {
    return undefined;
  }

  const response = await axiosClient.post<ApiEnvelope<unknown>>('/api/v1/settlements/transfer', {
    settlementIds,
  });

  if (response.data?.success === false) {
    throw new Error(response.data?.msg ?? '정산 처리에 실패했습니다.');
  }

  return response.data?.msg;
};
