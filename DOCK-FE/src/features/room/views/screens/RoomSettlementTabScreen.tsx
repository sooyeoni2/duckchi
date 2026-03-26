import React from 'react';

import type { RoomSettlementRow } from '../../models/roomSettlementOverviewTypes';
import {
  RoomSettlementDetailScreen,
  type SettlementDetailState,
} from './RoomSettlementDetailScreen';
import { RoomSettlementOverviewScreen } from './RoomSettlementOverviewScreen';

interface RoomSettlementTabScreenProps {
  isSettlementDetailOpen: boolean;
  settlementDetailState: SettlementDetailState;
  settlementRefreshing: boolean;
  settlementOverviewErrorMessage?: string;
  expectedAmount: number;
  totalAmount: number;
  participatedPayments: RoomSettlementRow[];
  settlementRequests: RoomSettlementRow[];
  onRefresh: () => Promise<void>;
  onOpenSettlementDetail: (expenseId: number) => void;
  onOpenTransfer: () => void;
  onRetrySettlementDetail: (expenseId: number) => void;
}

export function RoomSettlementTabScreen({
  isSettlementDetailOpen,
  settlementDetailState,
  settlementRefreshing,
  settlementOverviewErrorMessage,
  expectedAmount,
  totalAmount,
  participatedPayments,
  settlementRequests,
  onRefresh,
  onOpenSettlementDetail,
  onOpenTransfer,
  onRetrySettlementDetail,
}: RoomSettlementTabScreenProps) {
  if (isSettlementDetailOpen) {
    return (
      <RoomSettlementDetailScreen
        settlementDetailState={settlementDetailState}
        onRetry={onRetrySettlementDetail}
      />
    );
  }

  return (
    <RoomSettlementOverviewScreen
      expectedAmount={expectedAmount}
      totalAmount={totalAmount}
      participatedPayments={participatedPayments}
      settlementRequests={settlementRequests}
      errorMessage={settlementOverviewErrorMessage}
      refreshing={settlementRefreshing}
      onRefresh={onRefresh}
      onOpenTransfer={onOpenTransfer}
      onOpenSettlementDetail={onOpenSettlementDetail}
    />
  );
}
