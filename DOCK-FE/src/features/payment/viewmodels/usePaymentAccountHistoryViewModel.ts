import React from 'react';
import {
  getAccountHistories,
  getAccountHistoryEntryDraft,
} from '../models/paymentService';
import type {
  AccountHistoryEntryDraft,
  AccountHistoryItem,
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
    (participant) => participant.isSelected,
  );

  if (selectedParticipants.length === 0) {
    return {
      ...draft,
      participants: draft.participants.map((participant) => ({
        ...participant,
        splitAmount: 0,
      })),
    };
  }

  const baseAmount = Math.floor(draft.amount / selectedParticipants.length);
  let remainingAmount = draft.amount % selectedParticipants.length;

  return {
    ...draft,
    participants: draft.participants.map((participant) => {
      if (!participant.isSelected) {
        return {
          ...participant,
          splitAmount: 0,
        };
      }

      const bonusAmount = remainingAmount > 0 ? 1 : 0;
      remainingAmount = Math.max(remainingAmount - 1, 0);

      return {
        ...participant,
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
      const histories = await getAccountHistories(roomId);

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
        const draft = await getAccountHistoryEntryDraft(roomId, historyId);
        setDraftState({
          status: 'loaded',
          draft,
        });
      } catch (error) {
        setDraftState({
          status: 'error',
          historyId,
          message:
            error instanceof Error
              ? error.message
              : '장바구니 등록 폼을 불러오지 못했습니다.',
        });
      }
    },
    [roomId],
  );

  const updateItemName = React.useCallback((itemName: string) => {
    setDraftState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: {
          ...previousState.draft,
          itemName,
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
          participants: previousState.draft.participants.map((participant) =>
            participant.userId === userId
              ? {
                  ...participant,
                  isSelected: !participant.isSelected,
                  splitAmount: participant.isSelected ? 0 : participant.splitAmount,
                }
              : participant,
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
      draftState.draft.itemName.trim().length === 0 ||
      draftState.draft.amount <= 0 ||
      draftState.draft.participants.every((participant) => !participant.isSelected)
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
            participants: previousState.draft.participants.map((participant) =>
              participant.userId === userId
                ? {
                    ...participant,
                    splitAmount: parseAmount(text),
                  }
                : participant,
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
      ? draftState.draft.participants.filter((participant) => participant.isSelected)
      : [];

  const selectedParticipantCount = selectedParticipants.length;
  const splitAmountTotal = selectedParticipants.reduce(
    (sum, participant) => sum + participant.splitAmount,
    0,
  );

  return {
    historyState,
    draftState,
    loadHistories,
    refreshHistories: loadHistories,
    openDraft,
    updateItemName,
    toggleParticipant,
    prepareSplitStep,
    updateParticipantSplitAmount,
    resetDraft,
    selectedParticipants,
    selectedParticipantCount,
    splitAmountTotal,
  };
}
