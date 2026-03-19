import React from 'react';
import { create } from 'zustand';
import { getMyExpenses } from '../models/paymentService';
import type {
  ExpenseStatus,
  ExpenseStatusFilter,
  MyExpenseItem,
} from '../models/paymentTypes';

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

interface PaymentListSummary {
  totalAmount: number;
  expenseCount: number;
  pendingCount: number;
  requestedCount: number;
  settledCount: number;
}

interface PaymentListStore {
  state: PaymentListState;
  syncRoom: (roomId: number) => void;
  loadExpenses: () => Promise<void>;
  selectStatus: (status: ExpenseStatusFilter) => void;
  markExpensesRequested: (expenseIds: number[]) => void;
  updateExpenseStatus: (
    expenseId: number,
    nextStatus: ExpenseStatus,
  ) => void;
  removeExpense: (expenseId: number) => void;
}

const createInitialState = (roomId: number): PaymentListState => ({
  status: 'idle',
  roomId,
  selectedStatus: 'ALL',
});

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

const emptySummary: PaymentListSummary = {
  totalAmount: 0,
  expenseCount: 0,
  pendingCount: 0,
  requestedCount: 0,
  settledCount: 0,
};

const buildSummary = (expenses: MyExpenseItem[]): PaymentListSummary => ({
  totalAmount: expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
  expenseCount: expenses.length,
  pendingCount: expenses.filter((expense) => expense.status === 'PENDING').length,
  requestedCount: expenses.filter((expense) => expense.status === 'REQUESTED').length,
  settledCount: expenses.filter((expense) => expense.status === 'SETTLED').length,
});

export function usePaymentListViewModel(roomId: number) {
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
    refresh: loadExpenses,
    selectStatus,
    markExpensesRequested,
    updateExpenseStatus,
    removeExpense,
  };
}
