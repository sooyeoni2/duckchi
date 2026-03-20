import type {
  AccountHistoryEntryDraft,
  AccountHistoryItem,
  AccountHistoryListResponse,
  AccountHistoryParticipantDraft,
  ExpenseInputType,
  ManualEntryDraft,
  ManualEntryParticipantDraft,
  MyExpenseDetail,
  MyExpenseItem,
  MyExpenseListResponse,
  PaymentEntryPreview,
} from './paymentTypes';
import {
  accountHistoryListResponseSchema,
  myExpenseListResponseSchema,
} from './paymentTypes';

const MOCK_MY_EXPENSES: MyExpenseListResponse = {
  success: true,
  data: [
    {
      expenseId: 1,
      roomSessionId: 101,
      title: '고기집',
      participantCount: 3,
      totalAmount: 120000,
      payerUserName: '류병선',
      status: 'PENDING',
      inputType: 'ACCOUNT_HISTORY',
      paidAt: '2026-02-28T18:30:30+09:00',
      createdAt: '2026-03-19T18:30:30+09:00',
    },
    {
      expenseId: 2,
      roomSessionId: 101,
      title: '엔젤리너스',
      participantCount: 4,
      totalAmount: 60000,
      payerUserName: '류병선',
      status: 'REQUESTED',
      inputType: 'OCR',
      paidAt: '2026-02-28T20:30:30+09:00',
      createdAt: '2026-03-18T20:30:30+09:00',
    },
    {
      expenseId: 3,
      roomSessionId: 101,
      title: '스터디룸 대관',
      participantCount: 5,
      totalAmount: 75000,
      payerUserName: '류병선',
      status: 'SETTLED',
      inputType: 'MANUAL',
      paidAt: '2026-03-13T21:00:00+09:00',
      createdAt: '2026-03-13T21:00:00+09:00',
    },
  ],
};

const MOCK_ACCOUNT_HISTORY_RESPONSE: AccountHistoryListResponse = {
  success: true,
  data: [
    {
      transactionMemo: '한우마당',
      amount: 120000,
      transactionAt: '2026-02-28T18:30:30+09:00',
    },
    {
      transactionMemo: '엔젤리너스',
      amount: 60000,
      transactionAt: '2026-02-28T20:30:30+09:00',
    },
    {
      transactionMemo: '편의점',
      amount: 10000,
      transactionAt: '2026-02-28T20:50:30+09:00',
    },
  ],
};

const MOCK_ACCOUNT_HISTORY_ENTRY_META: Record<
  string,
  {
    itemName: string;
    participants: AccountHistoryParticipantDraft[];
  }
> = {
  'account-history-1': {
    itemName: '고기집',
    participants: [
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
    ],
  },
  'account-history-2': {
    itemName: '카페 정산',
    participants: [
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
        isSelected: false,
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
        isSelected: true,
        isMe: false,
        splitAmount: 0,
      },
    ],
  },
  'account-history-3': {
    itemName: '간식비',
    participants: [
      {
        userId: 1,
        userName: '박성환',
        isSelected: false,
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
    ],
  },
};

const MOCK_MANUAL_ENTRY_DRAFT: ManualEntryDraft = {
  itemName: '고기집',
  totalAmount: 120000,
  participants: [
    {
      userId: 1,
      userName: '박성환',
      isSelected: true,
      isMe: false,
      splitAmount: 40000,
    },
    {
      userId: 2,
      userName: '정우주',
      isSelected: true,
      isMe: false,
      splitAmount: 40000,
    },
    {
      userId: 3,
      userName: '류병선 (나)',
      isSelected: true,
      isMe: true,
      splitAmount: 40000,
    },
    {
      userId: 4,
      userName: '김수연',
      isSelected: false,
      isMe: false,
      splitAmount: 0,
    },
  ],
};

const MOCK_EXPENSE_DETAILS: Record<
  number,
  Omit<MyExpenseDetail, keyof MyExpenseItem>
> = {
  1: {
    storeName: '한우마당',
    memo:
      '계좌 내역에서 불러온 거래를 기준으로 정산 제목과 참여자만 먼저 정리한 항목입니다.',
    participants: [
      {
        userId: 1,
        userName: '류병선',
        splitAmount: 40000,
        isRequester: true,
        isSettled: false,
      },
      {
        userId: 2,
        userName: '박성환',
        splitAmount: 40000,
        isRequester: false,
        isSettled: false,
      },
      {
        userId: 3,
        userName: '정우주',
        splitAmount: 40000,
        isRequester: false,
        isSettled: false,
      },
    ],
    lineItems: [],
    sourceInfoRows: [
      { label: '거래 시간', value: '2026.02.28 18:30:30' },
      { label: '거래 금액', value: '120,000원' },
      { label: '거래 메모', value: '한우마당' },
    ],
  },
  2: {
    storeName: '엔젤리너스 홍대점',
    memo: '영수증 OCR로 항목을 정리한 뒤 정산 요청까지 진행한 항목입니다.',
    participants: [
      {
        userId: 1,
        userName: '류병선',
        splitAmount: 15000,
        isRequester: true,
        isSettled: false,
      },
      {
        userId: 2,
        userName: '박성환',
        splitAmount: 15000,
        isRequester: false,
        isSettled: true,
      },
      {
        userId: 3,
        userName: '정우주',
        splitAmount: 15000,
        isRequester: false,
        isSettled: false,
      },
      {
        userId: 4,
        userName: '김수연',
        splitAmount: 15000,
        isRequester: false,
        isSettled: false,
      },
    ],
    lineItems: [
      {
        itemId: 201,
        name: '아메리카노',
        quantity: 3,
        amount: 18000,
        assignedParticipants: ['류병선', '박성환', '정우주'],
        assignmentDetails: [
          {
            userId: 1,
            userName: '박성환',
            quantity: 1,
            amount: 6000,
          },
          {
            userId: 2,
            userName: '정우주',
            quantity: 1,
            amount: 6000,
          },
          {
            userId: 3,
            userName: '류병선',
            quantity: 1,
            amount: 6000,
          },
        ],
      },
      {
        itemId: 202,
        name: '카페라떼',
        quantity: 1,
        amount: 6000,
        assignedParticipants: ['김수연'],
        assignmentDetails: [
          {
            userId: 4,
            userName: '김수연',
            quantity: 1,
            amount: 6000,
          },
        ],
      },
      {
        itemId: 203,
        name: '치즈케이크',
        quantity: 0,
        amount: 36000,
        assignedParticipants: ['류병선', '정우주', '김수연'],
        assignmentDetails: [
          {
            userId: 1,
            userName: '박성환',
            quantity: 0,
            amount: 12000,
          },
          {
            userId: 3,
            userName: '류병선',
            quantity: 0,
            amount: 12000,
          },
          {
            userId: 4,
            userName: '김수연',
            quantity: 0,
            amount: 12000,
          },
        ],
      },
    ],
  },
  3: {
    storeName: '스터디룸 예약',
    memo: '직접 입력으로 등록한 공용 대관비입니다. 정산이 모두 완료된 상태입니다.',
    participants: [
      {
        userId: 1,
        userName: '류병선',
        splitAmount: 15000,
        isRequester: true,
        isSettled: true,
      },
      {
        userId: 2,
        userName: '박성환',
        splitAmount: 15000,
        isRequester: false,
        isSettled: true,
      },
      {
        userId: 3,
        userName: '정우주',
        splitAmount: 15000,
        isRequester: false,
        isSettled: true,
      },
      {
        userId: 4,
        userName: '김수연',
        splitAmount: 15000,
        isRequester: false,
        isSettled: true,
      },
      {
        userId: 5,
        userName: '최예린',
        splitAmount: 15000,
        isRequester: false,
        isSettled: true,
      },
    ],
    lineItems: [],
  },
};

const MOCK_ENTRY_PREVIEWS: Record<ExpenseInputType, PaymentEntryPreview> = {
  ACCOUNT_HISTORY: {
    inputType: 'ACCOUNT_HISTORY',
    title: '계좌 내역',
    headline: '거래 내역에서 정산할 항목을 선택하는 화면',
    description:
      '백엔드 계좌 내역 API가 붙기 전까지는 어떤 거래를 정산안으로 옮길지 흐름과 필드 구성을 먼저 검토합니다.',
    fieldGuides: [
      { label: '조회 기간', value: '최근 7일 / 최근 1개월 / 직접 설정' },
      { label: '계좌 선택', value: '주계좌 1개 기준, 다계좌 확장은 추후 검토' },
      { label: '목록 필터', value: '입출금, 금액 범위, 검색어' },
    ],
    checklist: [
      '거래 내역 카드에서 정산할 건을 선택할 수 있어야 합니다.',
      '이미 등록한 정산안과 중복되지 않도록 확인 문구가 필요합니다.',
      '선택 후 제목, 금액, 참여자 편집 단계로 자연스럽게 이어져야 합니다.',
    ],
    primaryActionLabel: '계좌 내역 목업 확인',
  },
  OCR: {
    inputType: 'OCR',
    title: '영수증 스캔',
    headline: 'OCR 결과를 보정하고 메뉴별 분담을 구성하는 화면',
    description:
      '영수증 업로드와 OCR 결과 보정 흐름을 먼저 검토합니다. 메뉴 단위 수정은 OCR에서만 노출합니다.',
    fieldGuides: [
      { label: '이미지 입력', value: '카메라 촬영 / 갤러리 업로드' },
      { label: '인식 결과 보정', value: '상호명, 일시, 총액, 메뉴명 수정' },
      { label: '분배 방식', value: '균등 분배 / 메뉴별 직접 분배' },
    ],
    checklist: [
      'OCR 실패 시 직접 입력으로 전환하는 fallback이 필요합니다.',
      '메뉴별 수량과 금액 수정에도 총합 검증이 유지돼야 합니다.',
      '참여자별 분담 금액과 메뉴 합계가 일치하는지 확인할 수 있어야 합니다.',
    ],
    primaryActionLabel: 'OCR 결과 목업 확인',
  },
  MANUAL: {
    inputType: 'MANUAL',
    title: '직접 입력',
    headline: '제목, 금액, 참여자 정보를 수기로 입력하는 화면',
    description:
      '메뉴 단위가 아니라 정산 제목과 총액 중심으로 입력하고, 참여자별 금액 분배를 후속 단계에서 설정합니다.',
    fieldGuides: [
      { label: '필수 필드', value: '제목, 총액, 참여자' },
      { label: '금액 입력', value: '숫자만 입력, 원 단위 suffix 분리' },
      { label: '검증 포인트', value: '참여자 분담 합계와 전체 금액 일치' },
    ],
    checklist: [
      '참여자 선택과 금액 수정 흐름이 모바일에서도 직관적이어야 합니다.',
      '총액과 분배 금액 차이를 즉시 확인할 수 있어야 합니다.',
      '등록 완료 후 결제 목록으로 자연스럽게 이어져야 합니다.',
    ],
    primaryActionLabel: '직접 입력 목업 확인',
  },
};

const MOCK_NETWORK_DELAY_MS = 250;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toMyExpenseItem = (
  expense: MyExpenseListResponse['data'][number],
): MyExpenseItem => ({
  expenseId: expense.expenseId,
  roomSessionId: expense.roomSessionId ?? null,
  title: expense.title,
  participantCount: expense.participantCount,
  totalAmount: expense.totalAmount,
  payerUserName: expense.payerUserName ?? '알 수 없음',
  status: expense.status ?? 'PENDING',
  inputType: expense.inputType ?? 'MANUAL',
  paidAt: expense.paidAt != null ? new Date(expense.paidAt) : null,
  createdAt: expense.createdAt != null ? new Date(expense.createdAt) : null,
  completedAt:
    expense.completedAt != null ? new Date(expense.completedAt) : null,
});

const buildMyExpenseItems = (): MyExpenseItem[] => {
  const validated = myExpenseListResponseSchema.parse(MOCK_MY_EXPENSES);
  return validated.data.map(toMyExpenseItem);
};

const buildAccountHistoryItems = (): AccountHistoryItem[] => {
  const validated = accountHistoryListResponseSchema.parse(
    MOCK_ACCOUNT_HISTORY_RESPONSE,
  );

  return validated.data.map((history, index) => ({
    historyId: `account-history-${index + 1}`,
    transactionMemo: history.transactionMemo,
    amount: history.amount,
    transactionAt: new Date(history.transactionAt),
  }));
};

const buildManualEntryDraft = (): ManualEntryDraft => ({
  itemName: MOCK_MANUAL_ENTRY_DRAFT.itemName,
  totalAmount: MOCK_MANUAL_ENTRY_DRAFT.totalAmount,
  participants: MOCK_MANUAL_ENTRY_DRAFT.participants.map(
    (participant): ManualEntryParticipantDraft => ({
      ...participant,
    }),
  ),
});

export const getMyExpenses = async (roomId: number): Promise<MyExpenseItem[]> => {
  void roomId;

  await wait(MOCK_NETWORK_DELAY_MS);
  return buildMyExpenseItems();
};

export const getExpenseDetail = async (
  expenseId: number,
): Promise<MyExpenseDetail> => {
  await wait(MOCK_NETWORK_DELAY_MS);

  const expense = buildMyExpenseItems().find(
    (candidate) => candidate.expenseId === expenseId,
  );
  const detail = MOCK_EXPENSE_DETAILS[expenseId];

  if (expense == null || detail == null) {
    throw new Error('상세 내역 mock 데이터를 찾지 못했습니다.');
  }

  return {
    ...expense,
    ...detail,
  };
};

export const getPaymentEntryPreview = (
  inputType: ExpenseInputType,
): PaymentEntryPreview => MOCK_ENTRY_PREVIEWS[inputType];

export const getAccountHistories = async (
  roomId: number,
): Promise<AccountHistoryItem[]> => {
  void roomId;

  await wait(MOCK_NETWORK_DELAY_MS);
  return buildAccountHistoryItems();
};

export const getAccountHistoryEntryDraft = async (
  roomId: number,
  historyId: string,
): Promise<AccountHistoryEntryDraft> => {
  void roomId;

  await wait(MOCK_NETWORK_DELAY_MS);

  const history = buildAccountHistoryItems().find(
    (candidate) => candidate.historyId === historyId,
  );
  const meta = MOCK_ACCOUNT_HISTORY_ENTRY_META[historyId];

  if (history == null || meta == null) {
    throw new Error('계좌 내역 장바구니 mock 데이터를 찾지 못했습니다.');
  }

  return {
    historyId: history.historyId,
    transactionMemo: history.transactionMemo,
    amount: history.amount,
    transactionAt: history.transactionAt,
    itemName: meta.itemName,
    participants: meta.participants.map((participant) => ({ ...participant })),
  };
};

export const getManualEntryDraft = async (
  roomId: number,
): Promise<ManualEntryDraft> => {
  void roomId;

  await wait(MOCK_NETWORK_DELAY_MS);
  return buildManualEntryDraft();
};


