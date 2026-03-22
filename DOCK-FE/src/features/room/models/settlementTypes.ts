export type SettlementTab = 'IN_PROGRESS' | 'COMPLETED';

export type DeadlineTone = 'SAFE' | 'CAUTION' | 'OVERDUE' | 'DONE';

export interface SettlementItem {
  id: number;
  storeName: string;
  requesterName: string;
  amount: number;
  status: SettlementTab;
  dueAt: string;
  paidAt?: string;
  paidCount: number;
  totalCount: number;
}

export interface SettlementViewItem extends SettlementItem {
  timeLabel: string;
  timeText: string;
  tone: DeadlineTone;
  guideMessage: string;
}

export type SettlementScreenState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; items: SettlementItem[] }
  | { status: 'error'; message: string };