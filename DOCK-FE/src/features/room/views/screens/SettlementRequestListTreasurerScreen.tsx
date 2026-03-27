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
      isLoading={viewModel.isLoading}
      isDirectCompleting={viewModel.isDirectCompleting}
      errorMessage={viewModel.errorMessage}
      onBackPress={onBackPress}
      onTogglePendingParticipant={viewModel.togglePendingParticipant}
      onDirectComplete={viewModel.directCompleteSelected}
      onRetry={viewModel.reload}
    />
  );
}
