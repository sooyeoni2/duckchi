import { ENDPOINTS } from '@core/constants/apiConstants';
import { axiosClient } from '@core/network/axiosClient';

import type {
  RoomSettlementOverviewData,
  RoomSettlementRow,
} from './roomSettlementOverviewTypes';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  msg?: string;
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

interface RoomMySetDto {
  myTotal: number;
  mySet: RoomMySetItemDto[];
  roomTotalAmount: number;
}

interface ExpenseSummaryDto {
  expenseId: number;
  title: string;
  totalAmount: number;
  payerUserName?: string | null;
  status?: 'PENDING' | 'REQUESTED' | 'SETTLED' | string | null;
}

const EMPTY_OVERVIEW_DATA: RoomSettlementOverviewData = {
  expectedAmount: 0,
  totalAmount: 0,
  participatedPayments: [],
  settlementRequests: [],
};

const toExpenseStatusText = (status?: string | null): string => {
  if (status === 'SETTLED') return '완료';
  if (status === 'REQUESTED') return '진행중';
  return '대기';
};

const toSettlementStatusText = (isCompleted: boolean): string =>
  isCompleted ? '완료' : '진행중';

const toParticipatedRow = (
  expense: ExpenseSummaryDto,
  mySetItem?: RoomMySetItemDto,
): RoomSettlementRow => ({
  id: expense.expenseId,
  title: expense.title,
  subtitle: `${expense.payerUserName ?? '알 수 없음'}님이 올림 · ${toExpenseStatusText(expense.status)}`,
  amount: expense.totalAmount,
  myStatus: mySetItem ? (mySetItem.isCompleted ? 'DONE' : 'PENDING') : null,
});

const toSettlementRequestRow = (item: RoomMySetItemDto): RoomSettlementRow => ({
  id: item.expenseId,
  title: item.title,
  subtitle: `${item.requesterUserName}님이 올림 · ${toSettlementStatusText(item.isCompleted)}`,
  amount: item.payableAmount,
});

const unwrapOrThrow = <T>(response: ApiEnvelope<T>, fallbackMessage: string): T => {
  if (response.success !== true) {
    throw new Error(response.msg ?? fallbackMessage);
  }
  return response.data;
};

export const fetchRoomSettlementOverview = async (
  roomId: number,
  currentUserName?: string,
): Promise<RoomSettlementOverviewData> => {
  // 정산 탭 핵심 데이터는 my-set 응답이므로, 이 호출 실패는 화면 실패로 취급한다.
  const mySetResponse = await axiosClient.get<ApiEnvelope<RoomMySetDto>>(
    ENDPOINTS.room.mySet(roomId),
  );
  const mySetData = unwrapOrThrow(
    mySetResponse.data,
    '정산 요약 정보를 불러오지 못했습니다.',
  );

  let expenseData: ExpenseSummaryDto[] = [];
  try {
    const expensesResponse = await axiosClient.get<ApiEnvelope<ExpenseSummaryDto[]>>(
      ENDPOINTS.payment.expenses(roomId),
    );
    expenseData = unwrapOrThrow(
      expensesResponse.data,
      '결제 목록을 불러오지 못했습니다.',
    );
  } catch {
    // 결제 목록 API 실패가 정산하기 진입을 막으면 안 되므로, 해당 섹션만 빈 값으로 폴백한다.
    expenseData = [];
  }

  return {
    expectedAmount: mySetData.myTotal ?? 0,
    totalAmount: mySetData.roomTotalAmount ?? 0,
    participatedPayments: (expenseData ?? [])
      .filter(exp => exp.payerUserName !== currentUserName)
      .map(exp => {
        const myDebit = (mySetData.mySet ?? []).find(ms => ms.expenseId === exp.expenseId);
        return toParticipatedRow(exp, myDebit);
      }),
    settlementRequests: (mySetData.mySet ?? [])
      .filter(ms => !ms.isCompleted) // '송금 전'인 것만 액션 존에 노출
      .map(toSettlementRequestRow),
  };
};

export const getEmptyRoomSettlementOverviewData = (): RoomSettlementOverviewData =>
  EMPTY_OVERVIEW_DATA;
