import type { SettlementItem } from './settlementTypes';
import { axiosClient } from '../../../core/network/axiosClient';

const USE_MOCK = false;
const DEADLINE_HOURS = 48;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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

const buildMockSettlements = (): SettlementItem[] => {
  const now = Date.now();

  return [
    {
      id: 1,
      storeName: '고기집',
      requesterName: '류병선',
      amount: 20000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now + 14 * 60 * 60 * 1000 + 32 * 60 * 1000 + 9 * 1000).toISOString(),
      paidCount: 5,
      totalCount: 6,
    },
    {
      id: 2,
      storeName: '엔젤리너스',
      requesterName: '류병선',
      amount: 10000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now + 8 * 60 * 60 * 1000 + 14 * 60 * 1000 + 22 * 1000).toISOString(),
      paidCount: 3,
      totalCount: 6,
    },
    {
      id: 3,
      storeName: '엔젤리너스',
      requesterName: '류병선',
      amount: 10000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now - (6 * 60 * 60 * 1000 + 22 * 60 * 1000 + 41 * 1000)).toISOString(),
      paidCount: 1,
      totalCount: 6,
    },
    {
      id: 4,
      storeName: '제주항공',
      requesterName: '김싸피',
      amount: 56000,
      status: 'COMPLETED',
      dueAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      paidCount: 6,
      totalCount: 6,
    },
  ];
};

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
  if (USE_MOCK) {
    await wait(250);
    return buildMockSettlements();
  }

  const response = await axiosClient.get(`/api/v1/rooms/${roomId}/my-set`);
  const payload = response.data?.data as RoomMySetResponseDto | undefined;
  return (payload?.mySet ?? []).map(toSettlementItem);
};

export const transferSettlements = async (settlementIds: number[]): Promise<void> => {
  if (settlementIds.length === 0) {
    return;
  }

  if (USE_MOCK) {
    await wait(250);
    return;
  }

  await axiosClient.post('/api/v1/settlements/transfer', { settlementIds });
};
