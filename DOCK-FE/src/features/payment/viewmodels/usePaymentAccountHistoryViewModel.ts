import React from 'react';
import {
  getAccountHistories,
  getAccountHistoryEntryDraft,
} from '../models/paymentService';
import type {
  AccountHistoryEntryDraft,
  AccountHistoryItem,
  ManualEntryParticipant,
} from '../models/paymentTypes';

export type PaymentAccountHistoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; histories: AccountHistoryItem[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type PaymentAccountHistoryDraftState =
  | { status: 'idle' }
  | { status: 'loading'; historyId: string }
  | { status: 'editing'; historyId: string } & AccountHistoryEntryDraft
  | { status: 'error'; message: string };

/**
 * 1/N 계산 유틸리티 (수동 입력 ViewModel과 로직 공유 가능하도록 설계)
 */
export const distributeEqually = (
  draft: AccountHistoryEntryDraft,
): AccountHistoryEntryDraft => {
  const selectedParticipants = draft.participants.filter((p) => p.isSelected);

  if (selectedParticipants.length === 0) {
    return {
      ...draft,
      participants: draft.participants.map((p) => ({ ...p, splitAmount: 0 })),
    };
  }

  const baseAmount = Math.floor(draft.totalAmount / selectedParticipants.length);
  let remainingAmount = draft.totalAmount % selectedParticipants.length;

  return {
    ...draft,
    participants: draft.participants.map((p: ManualEntryParticipant) => {
      if (!p.isSelected) {
        return { ...p, splitAmount: 0 };
      }

      const bonusAmount = remainingAmount > 0 ? 1 : 0;
      remainingAmount = Math.max(remainingAmount - 1, 0);

      return {
        ...p,
        splitAmount: baseAmount + bonusAmount,
      };
    }),
  };
};

export function usePaymentAccountHistoryViewModel(roomId: number) {
  const [historyState, setHistoryState] =
    React.useState<PaymentAccountHistoryState>({
      status: 'idle',
    });
  const [draftState, setDraftState] =
    React.useState<PaymentAccountHistoryDraftState>({
      status: 'idle',
    });

  React.useEffect(() => {
    setHistoryState({ status: 'idle' });
    setDraftState({ status: 'idle' });
  }, [roomId]);

  const loadHistories = React.useCallback(async () => {
    setHistoryState({ status: 'loading' });

    try {
      const histories = await getAccountHistories();

      if (histories.length === 0) {
        setHistoryState({ status: 'empty' });
        return;
      }

      setHistoryState({
        status: 'loaded',
        histories,
      });
    } catch (error) {
      setHistoryState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : '계좌 내역을 불러오지 못했습니다.',
      });
    }
  }, []);

  React.useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  const openDraft = React.useCallback(
    async (historyId: string) => {
      setDraftState({ status: 'loading', historyId });

      try {
        const draft = await getAccountHistoryEntryDraft(roomId);
        const history = (
          historyState.status === 'loaded' ? historyState.histories : []
        ).find((h) => h.historyId === historyId);

        if (!history) {
          throw new Error('거래 내역을 찾을 수 없습니다.');
        }

        setDraftState({
          status: 'editing',
          historyId,
          ...draft,
          title: history.transactionMemo,
          totalAmount: history.amount,
          transactionMemo: history.transactionMemo,
          transactionAt: history.transactionAt,
        });
      } catch (error) {
        setDraftState({
          status: 'error',
          message:
            error instanceof Error ? error.message : '초안 생성에 실패했습니다.',
        });
      }
    },
    [historyState, roomId],
  );

  const selectHistory = (historyId: string) => {
    openDraft(historyId);
  };

  const toggleParticipant = (userId: number) => {
    setDraftState((prev) => {
      if (prev.status !== 'editing') return prev;

      const nextParticipants = prev.participants.map((p) =>
        p.userId === userId ? { ...p, isSelected: !p.isSelected } : p,
      );

      return distributeEqually({
        ...prev,
        participants: nextParticipants,
      });
    });
  };

  const updateAmount = (userId: number, amount: number) => {
    setDraftState((prev) => {
      if (prev.status !== 'editing') return prev;

      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.userId === userId ? { ...p, splitAmount: amount } : p,
        ),
      };
    });
  };

  const splitEqually = () => {
    setDraftState((prev) => {
      if (prev.status !== 'editing') return prev;
      return distributeEqually(prev);
    });
  };

  const resetDraft = () => {
    setDraftState({ status: 'idle' });
  };

  return {
    historyState,
    draftState,
    loadHistories,
    refresh: () => loadHistories(),
    refreshHistories: () => loadHistories(),
    selectHistory,
    toggleParticipant,
    updateAmount,
    splitEqually,
    resetDraft,
    updateTitle: (title: string) =>
      setDraftState((prev) =>
        prev.status === 'editing' ? { ...prev, title } : prev,
      ),
  };
}
