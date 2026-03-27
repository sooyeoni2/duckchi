import type { ExpenseInputType } from '../types/paymentTypes';

export interface PaymentContentLayoutState {
  headerTitle: string | null;
  topTabMode: 'ROOM' | 'ENTRY' | 'NONE';
  activeEntryTab: ExpenseInputType | null;
  showRoomActions: boolean;
}

export const defaultPaymentContentLayoutState: PaymentContentLayoutState = {
  headerTitle: null,
  topTabMode: 'ROOM',
  activeEntryTab: null,
  showRoomActions: true,
};

export const PAYMENT_ENTRY_TABS: Array<{
  key: ExpenseInputType;
  label: string;
}> = [
  { key: 'ACCOUNT_HISTORY', label: '계좌 내역' },
  { key: 'OCR', label: '영수증' },
  { key: 'MANUAL', label: '직접 입력' },
];
