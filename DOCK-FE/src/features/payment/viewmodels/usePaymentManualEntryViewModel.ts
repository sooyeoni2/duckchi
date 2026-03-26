import React from 'react';
import { getManualEntryDraft } from '../models/services/paymentService';
import type { ManualEntryDraft } from '../models/types/paymentTypes';

/**
 * 직접 입력 flow의 draft 조회 상태.
 */
export type PaymentManualEntryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; draft: ManualEntryDraft }
  | { status: 'error'; message: string };

const parseAmount = (text: string): number => {
  const digitsOnly = text.replace(/[^0-9]/g, '');
  return digitsOnly.length > 0 ? Number(digitsOnly) : 0;
};

const distributeAmountEvenly = (draft: ManualEntryDraft): ManualEntryDraft => {
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

  const baseAmount = Math.floor(draft.totalAmount / selectedParticipants.length);
  let remainingAmount = draft.totalAmount % selectedParticipants.length;

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

/**
 * 직접 입력 mock 전용 ViewModel.
 * amount/participant/splitAmount를 한 draft에서 이어서 관리한다.
 */
export function usePaymentManualEntryViewModel(roomId: number) {
  const [state, setState] = React.useState<PaymentManualEntryState>({
    status: 'idle',
  });

  React.useEffect(() => {
    setState({ status: 'idle' });
  }, [roomId]);

  const loadDraft = React.useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const draft = await getManualEntryDraft(roomId);
      setState({
        status: 'loaded',
        draft,
      });
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : '직접 입력 초안을 불러오지 못했습니다.',
      });
    }
  }, [roomId]);

  const resetDraft = React.useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const loadDraftFromDetail = React.useCallback(async (detail: any) => {
    setState({ status: 'loading' });
    try {
      // API 통신부를 통해 모임방 멤버들을 가져온 뒤 detail 정보로 오버라이드.
      const participants = await getManualEntryDraft(roomId).then(d => d.participants);
      
      const hydratedParticipants = participants.map((p: any) => {
        const matched = detail.participants.find((ep: any) => ep.userId === p.userId);
        return {
          ...p,
          isSelected: !!matched,
          splitAmount: matched ? matched.splitAmount : 0,
        };
      });

      setState({
        status: 'loaded',
        draft: {
          expenseId: detail.expenseId,
          roomSessionId: detail.roomSessionId,
          title: detail.title,
          totalAmount: detail.totalAmount,
          participants: hydratedParticipants,
        },
      });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '초안을 불러오지 못했습니다.',
      });
    }
  }, [roomId]);

  const updateTitle = React.useCallback((title: string) => {
    setState((previousState) => {
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

  const updateTotalAmount = React.useCallback((text: string) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: {
          ...previousState.draft,
          totalAmount: parseAmount(text),
        },
      };
    });
  }, []);

  const toggleParticipant = React.useCallback((userId: number) => {
    setState((previousState) => {
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
    if (state.status !== 'loaded') {
      return false;
    }

    if (
      state.draft.title.trim().length === 0 ||
      state.draft.totalAmount <= 0 ||
      state.draft.participants.every((participant) => !participant.isSelected)
    ) {
      return false;
    }

    setState({
      status: 'loaded',
      draft: distributeAmountEvenly(state.draft),
    });

    return true;
  }, [state]);

  const updateParticipantSplitAmount = React.useCallback(
    (userId: number, text: string) => {
      setState((previousState) => {
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

  const selectedParticipants =
    state.status === 'loaded'
      ? state.draft.participants.filter((participant) => participant.isSelected)
      : [];

  const selectedParticipantCount = selectedParticipants.length;
  const splitAmountTotal = selectedParticipants.reduce(
    (sum, participant) => sum + participant.splitAmount,
    0,
  );

  return {
    state,
    loadDraft,
    loadDraftFromDetail,
    resetDraft,
    updateTitle,
    updateTotalAmount,
    toggleParticipant,
    prepareSplitStep,
    updateParticipantSplitAmount,
    selectedParticipants,
    selectedParticipantCount,
    splitAmountTotal,
  };
}
