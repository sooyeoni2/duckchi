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
  if (status === 'SETTLED') return '\uC644\uB8CC';
  if (status === 'REQUESTED') return '\uC9C4\uD589\uC911';
  return '\uB300\uAE30';
};

const toParticipatedRow = (
  expense: ExpenseSummaryDto,
  mySetItem?: RoomMySetItemDto,
): RoomSettlementRow => ({
  id: expense.expenseId,
  title: expense.title,
  subtitle: `${expense.payerUserName ?? '\uC54C \uC218 \uC5C6\uC74C'}\uB2D8\uC774 \uC62C\uB9BC \u00B7 ${toExpenseStatusText(expense.status)}`,
  amount: expense.totalAmount,
  myStatus: mySetItem ? (mySetItem.isCompleted ? 'DONE' : 'PENDING') : null,
});

const toSettlementRequestRow = (expense: ExpenseSummaryDto): RoomSettlementRow => ({
  id: expense.expenseId,
  title: expense.title,
  subtitle: `${expense.payerUserName ?? '\uC54C \uC218 \uC5C6\uC74C'}\uB2D8\uC774 \uC62C\uB9BC \u00B7 ${toExpenseStatusText(expense.status)}`,
  amount: expense.totalAmount,
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
  // my-set is the source of expected amount / room total in settlement tab.
  const mySetResponse = await axiosClient.get<ApiEnvelope<RoomMySetDto>>(
    ENDPOINTS.room.mySet(roomId),
  );
  const mySetData = unwrapOrThrow(
    mySetResponse.data,
    '\uC815\uC0B0 \uC694\uC57D \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  );

  let expenseData: ExpenseSummaryDto[] = [];
  try {
    const expensesResponse = await axiosClient.get<ApiEnvelope<ExpenseSummaryDto[]>>(
      ENDPOINTS.payment.expenses(roomId),
    );
    expenseData = unwrapOrThrow(
      expensesResponse.data,
      '\uACB0\uC81C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
    );
  } catch {
    expenseData = [];
  }

  // requester-only settlement request cards should come from "my expenses".
  let myExpenseData: ExpenseSummaryDto[] = [];
  try {
    const myExpensesResponse = await axiosClient.get<ApiEnvelope<ExpenseSummaryDto[]>>(
      ENDPOINTS.payment.myExpenses(roomId),
    );
    myExpenseData = unwrapOrThrow(
      myExpensesResponse.data,
      '\uB0B4\uAC00 \uC62C\uB9B0 \uACB0\uC81C \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
    );
  } catch {
    // Keep behavior resilient even when my-expenses API is temporarily unavailable.
    myExpenseData = (expenseData ?? []).filter((expense) => expense.payerUserName === currentUserName);
  }

  const myExpenseIdSet = new Set((myExpenseData ?? []).map((expense) => expense.expenseId));

  return {
    expectedAmount: mySetData.myTotal ?? 0,
    totalAmount: mySetData.roomTotalAmount ?? 0,
    participatedPayments: (expenseData ?? [])
      .filter((expense) => !myExpenseIdSet.has(expense.expenseId))
      .map((expense) => {
        const myDebit = (mySetData.mySet ?? []).find((settlement) => settlement.expenseId === expense.expenseId);
        return toParticipatedRow(expense, myDebit);
      }),
    settlementRequests: (myExpenseData ?? [])
      .filter((expense) => expense.status === 'REQUESTED')
      .map(toSettlementRequestRow),
  };
};

export const getEmptyRoomSettlementOverviewData = (): RoomSettlementOverviewData =>
  EMPTY_OVERVIEW_DATA;
