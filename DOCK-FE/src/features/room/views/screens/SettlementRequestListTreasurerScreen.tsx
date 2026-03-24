import React from 'react';

import { SettlementRequestListView } from '../components/SettlementRequestListView';
import type { useSettlementRequestListViewModel } from '../../viewmodels/useSettlementRequestListViewModel';

type SettlementRequestListViewModel = ReturnType<typeof useSettlementRequestListViewModel>;

interface SettlementRequestListTreasurerScreenProps {
  viewModel: SettlementRequestListViewModel;
  onBackPress: () => void;
}

export function SettlementRequestListTreasurerScreen({
  viewModel,
  onBackPress,
}: SettlementRequestListTreasurerScreenProps) {
  return (
    <SettlementRequestListView
      data={viewModel.data}
      participants={viewModel.participants}
      isTreasurer
      selectedPendingId={viewModel.selectedPendingId}
      canDirectComplete={viewModel.canDirectComplete}
      onBackPress={onBackPress}
      onTogglePendingParticipant={viewModel.togglePendingParticipant}
    />
  );
}