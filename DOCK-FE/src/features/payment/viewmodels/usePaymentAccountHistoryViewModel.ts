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

/**
 * 계좌 내역 flow의 조회 상태.
 */
export type PaymentAccountHistoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; histories: AccountHistoryItem[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

/**
 * 계좌 내역 기반 정산 초안 상태.
 */
export type PaymentAccountHistoryDraftState =
  | { status: 'idle' }
  | { status: 'loading'; historyId: string }
  | { status: 'loaded'; draft: AccountHistoryEntryDraft }
  | { status: 'error'; historyId: string; message: string };

const parseAmount = (text: string): number => {
  const digitsOnly = text.replace(/[^0-9]/g, '');
  return digitsOnly.length > 0 ? Number(digitsOnly) : 0;
};

const distributeAmountEvenly = (
  draft: AccountHistoryEntryDraft,
): AccountHistoryEntryDraft => {
  const selectedParticipants = draft.participants.filter(
    (p: ManualEntryParticipant) => p.isSelected,
  );

  if (selectedParticipants.length === 0) {
    return {
      ...draft,
      participants: draft.participants.map((p: ManualEntryParticipant) => ({
        ...p,
        splitAmount: 0,
      })),
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
      // API 호출 시 roomId는 string이어야 하므로 변환 (API 명세 준수)
      const histories = await getAccountHistories(roomId.toString());

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
  }, [roomId]);

  const openDraft = React.useCallback(
    async (historyId: string) => {
      setDraftState({ status: 'loading', historyId });

      try {
        const draft = await getAccountHistoryEntryDraft(roomId.toString());
        // historyId를 draft에 강제 주입 (View 레이어 호환성)
        const enrichedDraft = { ...draft, historyId };
        
        setDraftState({
          status: 'loaded',
          draft: enrichedDraft,
        });
      } catch (error) {
        setDraftState({
          status: 'error',
          historyId,
          message:
            error instanceof Error
              ? error.message
              : '정산 등록 폼을 불러오지 못했습니다.',
        });
      }
    },
    [roomId],
  );

  const updateTitle = React.useCallback((title: string) => {
    setDraftState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: {
          ...previousState.draft,
          title,
        },
      };
    });
  }, []);

  const toggleParticipant = React.useCallback((userId: number) => {
    setDraftState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: {
          ...previousState.draft,
          participants: previousState.draft.participants.map((p: ManualEntryParticipant) =>
            p.userId === userId
              ? {
                  ...p,
                  isSelected: !p.isSelected,
                  splitAmount: p.isSelected ? 0 : p.splitAmount,
                }
              : p,
          ),
        },
      };
    });
  }, []);

  const prepareSplitStep = React.useCallback(() => {
    if (draftState.status !== 'loaded') {
      return false;
    }

    if (
      draftState.draft.title.trim().length === 0 ||
      draftState.draft.totalAmount <= 0 ||
      draftState.draft.participants.every((p: ManualEntryParticipant) => !p.isSelected)
    ) {
      return false;
    }

    setDraftState({
      status: 'loaded',
      draft: distributeAmountEvenly(draftState.draft),
    });

    return true;
  }, [draftState]);

  const updateParticipantSplitAmount = React.useCallback(
    (userId: number, text: string) => {
      setDraftState((previousState) => {
        if (previousState.status !== 'loaded') {
          return previousState;
        }

        return {
          status: 'loaded',
          draft: {
            ...previousState.draft,
            participants: previousState.draft.participants.map((p: ManualEntryParticipant) =>
              p.userId === userId
                ? {
                    ...p,
                    splitAmount: parseAmount(text),
                  }
                : p,
            ),
          },
        };
      });
    },
    [],
  );

  const resetDraft = React.useCallback(() => {
    setDraftState({ status: 'idle' });
  }, []);

  const selectedParticipants =
    draftState.status === 'loaded'
      ? draftState.draft.participants.filter((p: ManualEntryParticipant) => p.isSelected)
      : [];

  const selectedParticipantCount = selectedParticipants.length;
  const splitAmountTotal = selectedParticipants.reduce(
    (sum: number, p: ManualEntryParticipant) => sum + p.splitAmount,
    0,
  );

  return {
    historyState,
    draftState,
    loadHistories,
    refreshHistories: loadHistories,
    openDraft,
    updateTitle,
    toggleParticipant,
    prepareSplitStep,
    updateParticipantSplitAmount,
    resetDraft,
    selectedParticipants,
    selectedParticipantCount,
    splitAmountTotal,
  };
}
