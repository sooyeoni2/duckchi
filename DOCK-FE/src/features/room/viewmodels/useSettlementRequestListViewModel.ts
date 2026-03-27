import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { useAuthStore } from '@features/auth/models/authStore';

import {
  completeSettlementManually,
  fetchSettlementRequestList,
} from '../models/settlementRequestListService';
import type {
  SettlementParticipantItem,
  SettlementRequestListData,
} from '../models/settlementRequestListTypes';

interface UseSettlementRequestListViewModelParams {
  roomId: number;
  expenseId?: number;
  expenseTitle?: string;
}

const buildInitialData = (
  roomId: number,
  expenseId?: number,
  expenseTitle?: string,
): SettlementRequestListData => ({
  roomId,
  expenseId: expenseId ?? 0,
  viewerRole: 'MEMBER',
  requesterName: '-',
  storeName: expenseTitle?.trim() ? expenseTitle : '-',
  totalAmount: 0,
  joinedSummary: '참여자 정보가 없습니다.',
  myAmount: 0,
  participants: [],
});

const toErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { msg?: string } | undefined)?.msg;
    return serverMessage ?? error.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

export const useSettlementRequestListViewModel = ({
  roomId,
  expenseId,
  expenseTitle,
}: UseSettlementRequestListViewModelParams) => {
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null);
  const [data, setData] = useState<SettlementRequestListData>(
    buildInitialData(roomId, expenseId, expenseTitle),
  );
  const [isLoading, setIsLoading] = useState(expenseId != null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    expenseId == null ? '정산 요청 결제 정보가 없어 목록을 불러올 수 없습니다.' : undefined,
  );
  const [selectedPendingId, setSelectedPendingId] = useState<number | null>(null);
  const [isDirectCompleting, setIsDirectCompleting] = useState(false);

  const load = useCallback(async () => {
    if (expenseId == null) {
      setData(buildInitialData(roomId, undefined, expenseTitle));
      setSelectedPendingId(null);
      setErrorMessage('정산 요청 결제 정보가 없어 목록을 불러올 수 없습니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const nextData = await fetchSettlementRequestList({
        expenseId,
        roomId,
        expenseTitle,
        currentUserId,
      });
      const firstPendingId =
        nextData.participants.find((item) => item.status === 'PENDING')?.id ?? null;

      setData(nextData);
      setSelectedPendingId((previousId) => {
        if (
          previousId != null &&
          nextData.participants.some(
            (item) => item.id === previousId && item.status === 'PENDING',
          )
        ) {
          return previousId;
        }
        return firstPendingId;
      });
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '정산 요청 목록을 불러오지 못했습니다.'));
      setData(buildInitialData(roomId, expenseId, expenseTitle));
      setSelectedPendingId(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, expenseId, expenseTitle, roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  const participants: SettlementParticipantItem[] = useMemo(
    () => data.participants,
    [data.participants],
  );
  const isTreasurer = data.viewerRole === 'TREASURER';
  const canDirectComplete =
    isTreasurer &&
    selectedPendingId != null &&
    !isLoading &&
    !isDirectCompleting;

  const togglePendingParticipant = useCallback(
    (participantId: number) => {
      if (!isTreasurer) return;

      const target = participants.find((item) => item.id === participantId);
      if (!target || target.status !== 'PENDING') return;

      setSelectedPendingId((previousId) =>
        previousId === participantId ? null : participantId,
      );
    },
    [isTreasurer, participants],
  );

  const directCompleteSelected = useCallback(async (): Promise<void> => {
    if (!isTreasurer || selectedPendingId == null || isDirectCompleting) {
      return;
    }

    setIsDirectCompleting(true);
    setErrorMessage(undefined);

    try {
      await completeSettlementManually(selectedPendingId);
      await load();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '직접 완료 처리에 실패했습니다.'));
    } finally {
      setIsDirectCompleting(false);
    }
  }, [isDirectCompleting, isTreasurer, load, selectedPendingId]);

  return {
    data,
    participants,
    isTreasurer,
    selectedPendingId,
    canDirectComplete,
    isLoading,
    isDirectCompleting,
    errorMessage,
    togglePendingParticipant,
    directCompleteSelected,
    reload: load,
  };
};
