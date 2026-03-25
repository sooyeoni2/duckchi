export interface RoomSettlementRow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
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

