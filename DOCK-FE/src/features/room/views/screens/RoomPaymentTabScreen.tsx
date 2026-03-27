import React from 'react';

import type { PaymentContentLayoutState } from '../../../payment/models/utils/paymentContentLayout';
import {
  PaymentTabContent,
  type PaymentTabContentHandle,
} from '../../../payment/views/components/entry/PaymentTabContent';
import { RoomSessionPlaceholder } from '../components/RoomSessionPlaceholder';

interface RoomPaymentTabScreenProps {
  roomId: number;
  roomStatus?: 'STARTED' | 'ENDED';
  paymentTabRef: React.RefObject<PaymentTabContentHandle | null>;
  onLayoutChange: (layoutState: PaymentContentLayoutState) => void;
  onStartRoom: () => void;
}

export function RoomPaymentTabScreen({
  roomId,
  roomStatus,
  paymentTabRef,
  onLayoutChange,
  onStartRoom,
}: RoomPaymentTabScreenProps) {
  if (roomStatus === 'ENDED') {
    return (
      <RoomSessionPlaceholder
        title="모임이 아직 시작되지 않았습니다"
        description="결제 내역을 등록하려면 모임을 시작해 주세요."
        buttonLabel="모임 시작하기"
        onPress={onStartRoom}
      />
    );
  }

  return (
    <PaymentTabContent
      ref={paymentTabRef}
      roomId={roomId}
      onLayoutChange={onLayoutChange}
    />
  );
}
