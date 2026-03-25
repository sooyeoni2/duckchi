export interface HomeProfile {
  name: string;
  tag: string;
  profileImageUrl: string | null;
}

export interface PendingSettlementCardItem {
  roomId: number;
  settlementId: number;
  expenseId: number;
  roomName: string;
  title: string;
  requesterName: string;
  amount: number;
  remainingHours: number;
  progressRatio: number;
}

export interface MonthlyTrendPoint {
  month: string;
  totalAmount: number;
}

export interface HomeDashboardData {
  profile: HomeProfile;
  pendingSettlements: PendingSettlementCardItem[];
  monthlyTrends: MonthlyTrendPoint[];
}

export type HomeTransferAction =
  | { type: 'single'; settlementId: number; roomId?: number }
  | { type: 'all' };

export type HomeDashboardState =
  | { status: 'loading' }
  | { status: 'loaded'; data: HomeDashboardData; fallbackSections: string[] }
  | { status: 'error'; message: string; data: HomeDashboardData };
