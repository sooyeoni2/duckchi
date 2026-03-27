export type SettlementViewerRole = 'TREASURER' | 'MEMBER';
export type SettlementParticipantStatus = 'COMPLETED' | 'PENDING';

export interface SettlementParticipantItem {
  id: number; // settlementId
  userId: number;
  name: string;
  amount: number;
  isMe?: boolean;
  status: SettlementParticipantStatus;
}

export interface SettlementRequestListData {
  roomId: number;
  expenseId: number;
  viewerRole: SettlementViewerRole;
  requesterName: string;
  storeName: string;
  totalAmount: number;
  joinedSummary: string;
  myAmount: number;
  participants: SettlementParticipantItem[];
}
