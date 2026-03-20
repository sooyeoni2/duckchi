import type {
  OcrFailureType,
  OcrImageSource,
  OcrLineItemDraft,
  OcrParticipantDraft,
  OcrReceiptDraft,
  OcrReceiptSummary,
  OcrRecognitionResult,
} from './paymentTypes';

const MOCK_NETWORK_DELAY_MS = 500;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const buildDefaultParticipants = (): OcrParticipantDraft[] => [
  {
    userId: 1,
    userName: '박성환',
    isSelected: true,
    isMe: false,
    splitAmount: 0,
  },
  {
    userId: 2,
    userName: '정우주',
    isSelected: true,
    isMe: false,
    splitAmount: 0,
  },
  {
    userId: 3,
    userName: '류병선 (나)',
    isSelected: true,
    isMe: true,
    splitAmount: 0,
  },
  {
    userId: 4,
    userName: '김수연',
    isSelected: false,
    isMe: false,
    splitAmount: 0,
  },
];

const buildDefaultItems = (): OcrLineItemDraft[] => [
  {
    itemId: 1,
    name: '삼겹살',
    unitPrice: 12000,
    quantity: 5,
    amount: 60000,
    assignment: null,
  },
  {
    itemId: 2,
    name: '소주',
    unitPrice: 5000,
    quantity: 10,
    amount: 50000,
    assignment: null,
  },
  {
    itemId: 3,
    name: '볶음밥',
    unitPrice: 4000,
    quantity: 5,
    amount: 20000,
    assignment: null,
  },
  {
    itemId: 4,
    name: '냉면',
    unitPrice: 10000,
    quantity: 2,
    amount: 20000,
    assignment: null,
  },
];

const buildSuccessDraft = (imageUri: string): OcrReceiptDraft => ({
  imageUri,
  storeName: '한우 마당',
  paidAt: new Date('2026-02-28T18:30:30+09:00'),
  totalAmount: 150000,
  splitMode: 'TOTAL',
  participants: buildDefaultParticipants(),
  items: buildDefaultItems(),
});

const buildItemsUnreadableSummary = (imageUri: string): OcrReceiptSummary => ({
  imageUri,
  storeName: '한우 마당',
  paidAt: new Date('2026-02-28T18:30:30+09:00'),
  totalAmount: 150000,
});

export async function recognizeReceiptImage(
  roomId: number,
  imageUri: string,
  source: OcrImageSource,
): Promise<OcrRecognitionResult> {
  void roomId;
  void source;

  await wait(MOCK_NETWORK_DELAY_MS);

  return {
    kind: 'SUCCESS',
    draft: buildSuccessDraft(imageUri),
  };
}

export async function getExistingOcrDraft(
  roomId: number,
  expenseId: number,
): Promise<OcrReceiptDraft> {
  void roomId;
  void expenseId;

  await wait(MOCK_NETWORK_DELAY_MS);

  return {
    ...buildSuccessDraft('https://example.com/mock-receipt.jpg'),
    storeName: '엔젤리너스',
    totalAmount: 60000,
    items: [
      {
        itemId: 11,
        name: '아메리카노',
        unitPrice: 4500,
        quantity: 4,
        amount: 18000,
        assignment: null,
      },
      {
        itemId: 12,
        name: '카페라떼',
        unitPrice: 5500,
        quantity: 4,
        amount: 22000,
        assignment: null,
      },
      {
        itemId: 13,
        name: '디저트',
        unitPrice: 10000,
        quantity: 2,
        amount: 20000,
        assignment: null,
      },
    ],
  };
}

export async function getUnreadableReceiptFailure(
  roomId: number,
): Promise<OcrFailureType> {
  void roomId;
  await wait(MOCK_NETWORK_DELAY_MS);
  return 'RECEIPT_UNREADABLE';
}

export async function getItemsUnreadableResult(
  roomId: number,
  imageUri: string,
): Promise<OcrRecognitionResult> {
  void roomId;
  await wait(MOCK_NETWORK_DELAY_MS);
  return {
    kind: 'ITEMS_UNREADABLE',
    summary: buildItemsUnreadableSummary(imageUri),
  };
}
