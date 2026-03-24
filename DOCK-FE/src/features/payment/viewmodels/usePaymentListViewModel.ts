import React from 'react';
import { create } from 'zustand';
import { getMyExpenses } from '../models/paymentService';
import type {
  ExpenseStatus,
  ExpenseStatusFilter,
  MyExpenseItem,
} from '../models/paymentTypes';

/**
 * payment 목록 화면의 모든 상태.
 * boolean 여러 개를 두는 것보다 status 한 명으로 관리합니다.
 */
export type PaymentListState =
  | { status: 'idle'; roomId: number | string; selectedStatus: ExpenseStatusFilter }
  | { status: 'loading'; roomId: number | string; selectedStatus: ExpenseStatusFilter }
  | {
      status: 'loaded';
      roomId: number | string;
      selectedStatus: ExpenseStatusFilter;
      expenses: MyExpenseItem[];
    }
  | { status: 'empty'; roomId: number | string; selectedStatus: ExpenseStatusFilter }
  | {
      status: 'error';
      roomId: number | string;
      selectedStatus: ExpenseStatusFilter;
      message: string;
    };

/**
 * 화면 상단 요약 카드용 데이터.
 * 매번 다시 계산하지 않고 summary를 주는 것이
 * 목록이 길어지면 유리할 수 있음.
 */
interface PaymentListSummary {
  totalAmount: number;
  expenseCount: number;
  pendingCount: number;
  requestedCount: number;
  settledCount: number;
}

/**
 * Zustand store는 "상태 정보 + 상태를 바꾸는 액션"을 가집니다.
 * UI 관련 로직은 여기에 두지 않고, Screen에서만 씁니다.
 */
interface PaymentListStore {
  state: PaymentListState;
  syncRoom: (roomId: number | string) => void;
  loadExpenses: () => Promise<void>;
  selectStatus: (status: ExpenseStatusFilter) => void;
  markExpensesRequested: (expenseIds: number[]) => void;
  updateExpenseStatus: (
    expenseId: number,
    nextStatus: ExpenseStatus,
  ) => void;
  removeExpense: (expenseId: number) => void;
}

/**
 * room에 진입했을 때의 초기 로드 상태.
 */
const createInitialState = (roomId: number | string): PaymentListState => ({
  status: 'idle',
  roomId,
  selectedStatus: 'ALL',
});

/**
 * 상태 값 변경을 안전하게 처리합니다.
 * 에러 시 다시 목록 조회를 해도 loaded 상태가 유지가 됨.
 */
const withSelectedStatus = (
  state: PaymentListState,
  selectedStatus: ExpenseStatusFilter,
): PaymentListState => {
  switch (state.status) {
    case 'loaded':
      return { ...state, selectedStatus };
    case 'error':
      return { ...state, selectedStatus };
    case 'loading':
      return { ...state, selectedStatus };
    case 'empty':
      return { ...state, selectedStatus };
    case 'idle':
    default:
      return { ...state, selectedStatus };
  }
};

const usePaymentListStore = create<PaymentListStore>((set, get) => ({
  state: createInitialState(1),

  /**
   * 다른 화면에서 roomId가 들어오면 store에 기록함.
   * room이 바뀌면 기존 목록은 room 간의 데이터가 섞일 수 있으므로 idle로 초기화함.
   */
  syncRoom: (roomId) => {
    set(({ state }) => {
      if (state.roomId === roomId) {
        return { state };
      }

      return {
        state: {
          status: 'idle',
          roomId,
          selectedStatus: state.selectedStatus,
        },
      };
    });
  },

  /**
   * 실제 목록 로드 액션.
   * 1. loading 상태 진입.
   * 2. service 호출.
   * 3. empty / loaded / error 중 하나를 선택.
   */
  loadExpenses: async () => {
    const roomId = get().state.roomId;

    set(({ state }) => ({
      state: {
        status: 'loading',
        roomId,
        selectedStatus: state.selectedStatus,
      },
    }));

    try {
      const expenses = await getMyExpenses(roomId);

      if (expenses.length === 0) {
        set(({ state }) => ({
          state: {
            status: 'empty',
            roomId,
            selectedStatus: state.selectedStatus,
          },
        }));
        return;
      }

      set(({ state }) => ({
        state: {
          status: 'loaded',
          roomId,
          selectedStatus: state.selectedStatus,
          expenses,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '내 결제 목록을 불러오지 못했습니다.';

      set(({ state }) => ({
        state: {
          status: 'error',
          roomId,
          selectedStatus: state.selectedStatus,
          message,
        },
      }));
    }
  },

  /**
   * 필터 탭 선택 (전체/정산 대기/요청/완료) 변경.
   */
  selectStatus: (status) => {
    set(({ state }) => ({
      state: withSelectedStatus(state, status),
    }));
  },

  markExpensesRequested: (expenseIds) => {
    if (expenseIds.length === 0) {
      return;
    }

    set(({ state }) => {
      if (state.status !== 'loaded') {
        return { state };
      }

      return {
        state: {
          ...state,
          expenses: state.expenses.map((expense) =>
            expenseIds.includes(expense.expenseId)
              ? { ...expense, status: 'REQUESTED' }
              : expense,
          ),
        },
      };
    });
  },

  updateExpenseStatus: (expenseId, nextStatus) => {
    set(({ state }) => {
      if (state.status !== 'loaded') {
        return { state };
      }

      return {
        state: {
          ...state,
          expenses: state.expenses.map((expense) =>
            expense.expenseId === expenseId
              ? { ...expense, status: nextStatus }
              : expense,
          ),
        },
      };
    });
  },

  removeExpense: (expenseId) => {
    set(({ state }) => {
      if (state.status !== 'loaded') {
        return { state };
      }

      const nextExpenses = state.expenses.filter(
        (expense) => expense.expenseId !== expenseId,
      );

      if (nextExpenses.length === 0) {
        return {
          state: {
            status: 'empty',
            roomId: state.roomId,
            selectedStatus: state.selectedStatus,
          },
        };
      }

      return {
        state: {
          ...state,
          expenses: nextExpenses,
        },
      };
    });
  },
}));

/**
 * loaded가 아닌 동안의 summary 카드 초기값.
 */
const emptySummary: PaymentListSummary = {
  totalAmount: 0,
  expenseCount: 0,
  pendingCount: 0,
  requestedCount: 0,
  settledCount: 0,
};

/**
 * 목록에서의 요약 카드 수치를 계산합니다.
 */
const buildSummary = (expenses: MyExpenseItem[]): PaymentListSummary => ({
  totalAmount: expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
  expenseCount: expenses.length,
  pendingCount: expenses.filter((expense) => expense.status === 'PENDING').length,
  requestedCount: expenses.filter((expense) => expense.status === 'REQUESTED').length,
  settledCount: expenses.filter((expense) => expense.status === 'SETTLED').length,
});

/**
 * Screen에서 사용하는 최종 ViewModel hook.
 * - store 상태 구독.
 * - roomId 진입 초기화.
 * - 유도 상태(filteredExpenses, summary) 계산.
 */
export function usePaymentListViewModel(roomId: number | string) {
  const state = usePaymentListStore((store) => store.state);
  const syncRoom = usePaymentListStore((store) => store.syncRoom);
  const loadExpenses = usePaymentListStore((store) => store.loadExpenses);
  const selectStatus = usePaymentListStore((store) => store.selectStatus);
  const markExpensesRequested = usePaymentListStore(
    (store) => store.markExpensesRequested,
  );
  const updateExpenseStatus = usePaymentListStore(
    (store) => store.updateExpenseStatus,
  );
  const removeExpense = usePaymentListStore((store) => store.removeExpense);

  React.useEffect(() => {
    syncRoom(roomId);
  }, [roomId, syncRoom]);

  /**
   * loaded 상태일 때만 실제 필터링된 결과물 전달.
   * 로딩 중이거나 텅 빈 경우라면 빈 배열을 주어 Screen 조건문의 단순화를 도와줍니다.
   */
  const filteredExpenses = React.useMemo(
    () =>
      state.status === 'loaded'
        ? state.selectedStatus === 'ALL'
          ? state.expenses
          : state.expenses.filter(
              (expense) => expense.status === state.selectedStatus,
            )
        : [],
    [state],
  );

  const summary = React.useMemo(
    () => (state.status === 'loaded' ? buildSummary(state.expenses) : emptySummary),
    [state],
  );

  return {
    state,
    filteredExpenses,
    summary,
    loadExpenses,
    // 목록 화면의 refreshControl과 초기 로드 액션을 공유합니다.
    refresh: loadExpenses,
    selectStatus,
    markExpensesRequested,
    updateExpenseStatus,
    removeExpense,
  };
}
