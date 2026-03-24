import React from 'react';

import { SettlementRequestListView } from '../components/SettlementRequestListView';
import type { useSettlementRequestListViewModel } from '../../viewmodels/useSettlementRequestListViewModel';

type SettlementRequestListViewModel = ReturnType<typeof useSettlementRequestListViewModel>;

interface SettlementRequestListMemberScreenProps {
  viewModel: SettlementRequestListViewModel;
  onBackPress: () => void;
}

export function SettlementRequestListMemberScreen({
  viewModel,
  onBackPress,
}: SettlementRequestListMemberScreenProps) {
  return (
    <SettlementRequestListView
      data={viewModel.data}
      participants={viewModel.participants}
      isTreasurer={false}
      selectedPendingId={viewModel.selectedPendingId}
      canDirectComplete={false}
      onBackPress={onBackPress}
      onTogglePendingParticipant={viewModel.togglePendingParticipant}
    />
  );
}