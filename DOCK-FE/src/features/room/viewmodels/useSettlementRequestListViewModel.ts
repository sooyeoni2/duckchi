import { useMemo, useState } from 'react';

import {
  getSettlementRequestListMock,
  type SettlementParticipantItem,
} from '../models/settlementRequestListMockData';

export const useSettlementRequestListViewModel = (roomId: number) => {
  const data = useMemo(() => getSettlementRequestListMock(roomId), [roomId]);
  const firstPendingId = useMemo(
    () => data.participants.find((item) => item.status === 'PENDING')?.id ?? null,
    [data.participants],
  );
  const [selectedPendingId, setSelectedPendingId] = useState<number | null>(firstPendingId);

  const isTreasurer = data.viewerRole === 'TREASURER';
  const canDirectComplete = isTreasurer && selectedPendingId != null;
  const participants: SettlementParticipantItem[] = data.participants;

  const togglePendingParticipant = (participantId: number) => {
    if (!isTreasurer) return;

    const target = data.participants.find((item) => item.id === participantId);
    if (!target || target.status !== 'PENDING') return;

    setSelectedPendingId((prev) => (prev === participantId ? null : participantId));
  };

  return {
    data,
    participants,
    isTreasurer,
    selectedPendingId,
    canDirectComplete,
    togglePendingParticipant,
  };
};