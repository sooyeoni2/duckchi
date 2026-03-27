import type { HomeDashboardData } from './homeTypes';

export const HOME_DASHBOARD_MOCK: HomeDashboardData = {
  profile: {
    name: '류병선',
    tag: '#123',
    profileImageUrl: null,
  },
  pendingSettlements: [
    {
      roomId: 101,
      settlementId: 1,
      expenseId: 11,
      roomName: 'C102 회식',
      title: 'C102 뒷풀이',
      requesterName: '류병선',
      amount: 39000,
      remainingHours: 23,
      progressRatio: 0.52,
    },
    {
      roomId: 101,
      settlementId: 2,
      expenseId: 12,
      roomName: 'C102 회식',
      title: '취뽀 기념',
      requesterName: '박성환',
      amount: 25000,
      remainingHours: 47,
      progressRatio: 0.05,
    },
  ],
  monthlyTrends: [
    { month: '2026-01', totalAmount: 230000 },
    { month: '2026-02', totalAmount: 430000 },
    { month: '2026-03', totalAmount: 300000 },
  ],
};
