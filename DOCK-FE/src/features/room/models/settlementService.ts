import type { SettlementItem } from './settlementTypes';

const USE_MOCK = true;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const buildMockSettlements = (): SettlementItem[] => {
  const now = Date.now();

  return [
    {
      id: 1,
      storeName: '고기집',
      requesterName: '류병선',
      amount: 20000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now + 14 * 60 * 60 * 1000 + 32 * 60 * 1000 + 9 * 1000).toISOString(),
      paidCount: 5,
      totalCount: 6,
    },
    {
      id: 2,
      storeName: '엔젤리너스',
      requesterName: '류병선',
      amount: 10000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now + 8 * 60 * 60 * 1000 + 14 * 60 * 1000 + 22 * 1000).toISOString(),
      paidCount: 3,
      totalCount: 6,
    },
    {
      id: 3,
      storeName: '엔젤리너스',
      requesterName: '류병선',
      amount: 10000,
      status: 'IN_PROGRESS',
      dueAt: new Date(now - (6 * 60 * 60 * 1000 + 22 * 60 * 1000 + 41 * 1000)).toISOString(),
      paidCount: 1,
      totalCount: 6,
    },
    {
      id: 4,
      storeName: '제주항공',
      requesterName: '김싸피',
      amount: 56000,
      status: 'COMPLETED',
      dueAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      paidCount: 6,
      totalCount: 6,
    },
  ];
};

export const fetchSettlementItems = async (): Promise<SettlementItem[]> => {
  if (!USE_MOCK) {
    throw new Error('정산 API 연동이 아직 연결되지 않았습니다.');
  }

  await wait(250);
  return buildMockSettlements();
};