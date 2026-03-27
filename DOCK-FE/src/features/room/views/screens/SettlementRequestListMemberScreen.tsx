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
      isLoading={viewModel.isLoading}
      isDirectCompleting={false}
      errorMessage={viewModel.errorMessage}
      onBackPress={onBackPress}
      onTogglePendingParticipant={viewModel.togglePendingParticipant}
      onRetry={viewModel.reload}
    />
  );
}
