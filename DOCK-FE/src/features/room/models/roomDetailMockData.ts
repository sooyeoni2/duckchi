export interface RoomSettlementRow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
}

export const roomParticipatedPaymentsMock: Record<number, RoomSettlementRow[]> = {
  101: [
    { id: 1, title: '고기집', subtitle: '류병선 올림 · 6명', amount: 120000 },
    { id: 2, title: '엔젤리너스', subtitle: '류병선 올림 · 6명', amount: 60000 },
  ],
  102: [],
};

export const roomSettlementRequestsMock: Record<number, RoomSettlementRow[]> = {
  101: [{ id: 3, title: '볼링', subtitle: '류병선 올림 · 6명', amount: 30000 }],
  102: [],
};
