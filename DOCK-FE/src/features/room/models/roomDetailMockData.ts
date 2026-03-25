export interface RoomSettlementRow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
}

export const roomParticipatedPaymentsMock: Record<number, RoomSettlementRow[]> = {
  101: [
    {
      id: 1,
      title: '고기집',
      subtitle: '류병선님이 올림 · 대기',
      amount: 120000,
    },
  ],
  102: [],
};

export const roomSettlementRequestsMock: Record<number, RoomSettlementRow[]> = {
  101: [
    {
      id: 2,
      title: '엔젤리너스',
      subtitle: '류병선님이 올림 · 진행중',
      amount: 60000,
    },
    {
      id: 3,
      title: '스터디룸 대관',
      subtitle: '류병선님이 올림 · 완료',
      amount: 75000,
    },
  ],
  102: [],
};
