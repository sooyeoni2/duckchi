import React from 'react';
import {
  getAccountHistories,
  getAccountHistoryEntryDraft,
} from '../models/paymentService';
import type {
  AccountHistoryEntryDraft,
  AccountHistoryItem,
} from '../models/paymentTypes';

/**
 * 계좌 내역 목록 조회 상태.
 * 리스트 화면은 이 상태만 보고 loading / empty / error / loaded를 분기한다.
 */
export type PaymentAccountHistoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; histories: AccountHistoryItem[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

/**
 * 계좌 내역에서 "장바구니 담기" 후 진입하는 draft 폼 상태.
 */
export type PaymentAccountHistoryDraftState =
  | { status: 'idle' }
  | { status: 'loading'; historyId: string }
  | { status: 'loaded'; draft: AccountHistoryEntryDraft }
  | { status: 'error'; historyId: string; message: string };

/**
 * payment feature 내부에서만 쓰는 계좌 내역 전용 ViewModel.
 * room 종속 상태이므로 전역 store로 빼지 않고, hook 인스턴스 로컬 상태로 관리한다.
 */
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
    // room이 바뀌면 이전 room의 거래 내역/참여자 draft를 그대로 가져가면 안 된다.
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

  /**
   * 장바구니 항목명은 사용자가 거래 메모와 다른 이름으로 정리할 수 있으므로 로컬 draft에서 수정한다.
   */
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

  /**
   * 참여자 토글은 API 호출 전까지 완전히 FE draft state만 변경한다.
   */
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
              ? { ...participant, isSelected: !participant.isSelected }
              : participant,
          ),
        },
      };
    });
  }, []);

  const resetDraft = React.useCallback(() => {
    setDraftState({ status: 'idle' });
  }, []);

  const selectedParticipantCount =
    draftState.status === 'loaded'
      ? draftState.draft.participants.filter((participant) => participant.isSelected)
          .length
      : 0;

  return {
    historyState,
    draftState,
    loadHistories,
    refreshHistories: loadHistories,
    openDraft,
    updateItemName,
    toggleParticipant,
    resetDraft,
    selectedParticipantCount,
  };
}
