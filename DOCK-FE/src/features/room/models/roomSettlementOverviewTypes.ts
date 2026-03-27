export type MySettlementStatus = 'PENDING' | 'DONE';

export interface RoomSettlementRow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
  myStatus?: MySettlementStatus | null;
}

export interface RoomSettlementOverviewData {
  expectedAmount: number;
  totalAmount: number;
  participatedPayments: RoomSettlementRow[];
  settlementRequests: RoomSettlementRow[];
}

export type RoomSettlementOverviewState =
  | { status: 'loading' }
  | { status: 'loaded'; data: RoomSettlementOverviewData }
  | { status: 'error'; message: string; data: RoomSettlementOverviewData };

