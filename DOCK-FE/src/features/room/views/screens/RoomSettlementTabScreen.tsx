import React from 'react';

import type { RoomSettlementRow } from '../../models/roomSettlementOverviewTypes';
import {
  RoomSettlementDetailScreen,
  type SettlementDetailState,
} from './RoomSettlementDetailScreen';
import { RoomSettlementOverviewScreen } from './RoomSettlementOverviewScreen';
import { RoomSessionPlaceholder } from '../components/RoomSessionPlaceholder';

interface RoomSettlementTabScreenProps {
  isSettlementDetailOpen: boolean;
  settlementDetailState: SettlementDetailState;
  settlementRefreshing: boolean;
  settlementOverviewErrorMessage?: string;
  expectedAmount: number;
  totalAmount: number;
  participatedPayments: RoomSettlementRow[];
  settlementRequests: RoomSettlementRow[];
  roomStatus?: 'STARTED' | 'ENDED';
  onRefresh: () => Promise<void>;
  onOpenSettlementDetail: (expenseId: number) => void;
  onOpenSettlementRequestList: (item: RoomSettlementRow) => void;
  onOpenTransfer: () => void;
  onRetrySettlementDetail: (expenseId: number) => void;
  onStartRoom: () => void;
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
  roomStatus,
  onRefresh,
  onOpenSettlementDetail,
  onOpenSettlementRequestList,
  onOpenTransfer,
  onRetrySettlementDetail,
  onStartRoom,
}: RoomSettlementTabScreenProps) {
  if (roomStatus === 'ENDED') {
    return (
      <RoomSessionPlaceholder
        title="모임이 아직 시작되지 않았습니다"
        description="정산 현황을 확인하려면 모임을 시작해 주세요."
        buttonLabel="모임 시작하기"
        onPress={onStartRoom}
      />
    );
  }

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
      onOpenSettlementRequestList={onOpenSettlementRequestList}
    />
  );
}
