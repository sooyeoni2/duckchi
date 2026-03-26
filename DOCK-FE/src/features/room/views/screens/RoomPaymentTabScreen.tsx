import React from 'react';

import type { PaymentContentLayoutState } from '../../../payment/models/paymentContentLayout';
import {
  PaymentTabContent,
  type PaymentTabContentHandle,
} from '../../../payment/views/components/PaymentTabContent';

interface RoomPaymentTabScreenProps {
  roomId: number;
  paymentTabRef: React.RefObject<PaymentTabContentHandle | null>;
  onLayoutChange: (layoutState: PaymentContentLayoutState) => void;
}

export function RoomPaymentTabScreen({
  roomId,
  paymentTabRef,
  onLayoutChange,
}: RoomPaymentTabScreenProps) {
  return (
    <PaymentTabContent
      ref={paymentTabRef}
      roomId={roomId}
      onLayoutChange={onLayoutChange}
    />
  );
}
