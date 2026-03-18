import React from 'react';
import { create } from 'zustand';
import { getMyExpenses } from '../models/paymentService';
import type {
  ExpenseStatusFilter,
  MyExpenseItem,
} from '../models/paymentTypes';

/**
 * payment 목록 화면이 가질 수 있는 모든 상태.
 * boolean 여러 개를 섞지 않고 status 하나로 명확하게 관리한다.
 */
export type PaymentListState =
  | { status: 'idle'; roomId: number; selectedStatus: ExpenseStatusFilter }
  | { status: 'loading'; roomId: number; selectedStatus: ExpenseStatusFilter }
  | {
      status: 'loaded';
      roomId: number;
      selectedStatus: ExpenseStatusFilter;
      expenses: MyExpenseItem[];
    }
  | { status: 'empty'; roomId: number; selectedStatus: ExpenseStatusFilter }
  | {
      status: 'error';
      roomId: number;
      selectedStatus: ExpenseStatusFilter;
      message: string;
    };

/**
 * 화면 상단 요약 카드에 넣을 파생 데이터.
 * 서버가 별도 summary를 주지 않아도 목록만 있으면 계산 가능하다.
 */
interface PaymentListSummary {
  totalAmount: number;
  expenseCount: number;
  pendingCount: number;
  requestedCount: number;
  settledCount: number;
}

/**
 * Zustand store는 "현재 상태 + 상태를 바꾸는 액션"만 가진다.
 * UI 관련 판단은 여기서 하지 않고, Screen이 state를 보고 렌더링한다.
 */
interface PaymentListStore {
  state: PaymentListState;
  syncRoom: (roomId: number) => void;
  loadExpenses: () => Promise<void>;
  selectStatus: (status: ExpenseStatusFilter) => void;
}

/**
 * room이 바뀌었을 때 기준이 되는 초기 상태 생성 함수.
 */
const createInitialState = (roomId: number): PaymentListState => ({
  status: 'idle',
  roomId,
  selectedStatus: 'ALL',
});

/**
 * 필터 변경은 어떤 상태에서든 허용한다.
 * 다만 실제 목록 필터링은 loaded 상태에서만 의미가 있다.
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
   * 현재 화면이 바라보는 roomId를 store에 동기화한다.
   * room이 바뀌면 기존 목록은 room 전용 데이터가 아니므로 idle로 초기화한다.
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
   * 실제 목록 조회 액션.
   * 1. loading 전환
   * 2. service 호출
   * 3. empty / loaded / error 중 하나로 귀결
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
   * 상단 상태 필터(전체/정산 전/요청됨/완료) 변경.
   */
  selectStatus: (status) => {
    set(({ state }) => ({
      state: withSelectedStatus(state, status),
    }));
  },
}));

/**
 * loaded가 아닐 때 summary 카드에 넣을 기본값.
 */
const emptySummary: PaymentListSummary = {
  totalAmount: 0,
  expenseCount: 0,
  pendingCount: 0,
  requestedCount: 0,
  settledCount: 0,
};

/**
 * 목록 배열에서 카드용 요약 수치를 계산한다.
 */
const buildSummary = (expenses: MyExpenseItem[]): PaymentListSummary => ({
  totalAmount: expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
  expenseCount: expenses.length,
  pendingCount: expenses.filter((expense) => expense.status === 'PENDING').length,
  requestedCount: expenses.filter((expense) => expense.status === 'REQUESTED').length,
  settledCount: expenses.filter((expense) => expense.status === 'SETTLED').length,
});

/**
 * Screen이 사용하는 최종 ViewModel hook.
 * - store 상태 구독
 * - roomId 동기화
 * - 파생 데이터(filteredExpenses, summary) 계산
 */
export function usePaymentListViewModel(roomId: number) {
  const state = usePaymentListStore((store) => store.state);
  const syncRoom = usePaymentListStore((store) => store.syncRoom);
  const loadExpenses = usePaymentListStore((store) => store.loadExpenses);
  const selectStatus = usePaymentListStore((store) => store.selectStatus);

  React.useEffect(() => {
    syncRoom(roomId);
  }, [roomId, syncRoom]);

  /**
   * loaded 상태에서만 실제 필터링이 일어난다.
   * 나머지 상태에서는 빈 배열을 반환해 Screen 조건문을 단순화한다.
   */
  const filteredExpenses =
    state.status === 'loaded'
      ? state.selectedStatus === 'ALL'
        ? state.expenses
        : state.expenses.filter(
            (expense) => expense.status === state.selectedStatus,
          )
      : [];

  const summary =
    state.status === 'loaded' ? buildSummary(state.expenses) : emptySummary;

  return {
    state,
    filteredExpenses,
    summary,
    loadExpenses,
    // 목록 화면에서는 refreshControl과 초기 로딩이 같은 액션을 공유한다.
    refresh: loadExpenses,
    selectStatus,
  };
}
