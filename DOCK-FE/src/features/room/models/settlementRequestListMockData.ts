export type SettlementViewerRole = 'TREASURER' | 'MEMBER';
export type SettlementParticipantStatus = 'COMPLETED' | 'PENDING';

export interface SettlementParticipantItem {
  id: number;
  name: string;
  amount: number;
  isMe?: boolean;
  status: SettlementParticipantStatus;
}

export interface SettlementRequestListMock {
  roomId: number;
  viewerRole: SettlementViewerRole;
  requesterName: string;
  storeName: string;
  totalAmount: number;
  joinedSummary: string;
  myAmount: number;
  participants: SettlementParticipantItem[];
}

const room101: SettlementRequestListMock = {
  roomId: 101,
  viewerRole: 'TREASURER',
  requesterName: '류병선',
  storeName: '고기집',
  totalAmount: 120000,
  joinedSummary: '2/28 · 6명 참여',
  myAmount: 20000,
  participants: [
    { id: 1, name: '박성환', amount: 20000, status: 'COMPLETED' },
    { id: 2, name: '정우주', amount: 20000, status: 'COMPLETED' },
    { id: 3, name: '류병선', amount: 20000, isMe: true, status: 'COMPLETED' },
    { id: 4, name: '임찬혁', amount: 20000, status: 'COMPLETED' },
    { id: 5, name: '강산천', amount: 20000, status: 'COMPLETED' },
    { id: 6, name: '김수연', amount: 20000, status: 'PENDING' },
  ],
};

const room102: SettlementRequestListMock = {
  roomId: 102,
  viewerRole: 'MEMBER',
  requesterName: '류병선',
  storeName: '고기집',
  totalAmount: 120000,
  joinedSummary: '2/28 · 6명 참여',
  myAmount: 20000,
  participants: [
    { id: 1, name: '박성환', amount: 20000, status: 'COMPLETED' },
    { id: 2, name: '정우주', amount: 20000, status: 'COMPLETED' },
    { id: 3, name: '류병선', amount: 20000, status: 'COMPLETED' },
    { id: 4, name: '임찬혁', amount: 20000, status: 'COMPLETED' },
    { id: 5, name: '강산천', amount: 20000, status: 'COMPLETED' },
    { id: 6, name: '김수연', amount: 20000, isMe: true, status: 'PENDING' },
  ],
};

const settlementRequestListMap: Record<number, SettlementRequestListMock> = {
  101: room101,
  102: room102,
};

export const getSettlementRequestListMock = (roomId: number): SettlementRequestListMock => {
  return settlementRequestListMap[roomId] ?? room101;
};