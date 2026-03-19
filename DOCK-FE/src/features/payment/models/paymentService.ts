import type {
  ExpenseInputType,
  MyExpenseDetail,
  MyExpenseItem,
  MyExpenseListResponse,
  PaymentEntryPreview,
} from './paymentTypes';
import { myExpenseListResponseSchema } from './paymentTypes';

/**
 * 현재 FE worktree에는 최신 백엔드 구현이 아직 합쳐지지 않았으므로,
 * payment feature는 mock 데이터를 먼저 서비스 경계 뒤에 숨겨둔다.
 *
 * 핵심 의도:
 * 1. Screen / ViewModel은 실제 API가 붙어도 구조를 거의 안 바꾸게 한다.
 * 2. service만 mock -> axios 호출로 교체한다.
 */
const MOCK_MY_EXPENSES: MyExpenseListResponse = {
  success: true,
  data: [
    {
      expenseId: 1,
      title: '고기집',
      participantCount: 3,
      totalAmount: 120000,
      status: 'PENDING',
      inputType: 'ACCOUNT_HISTORY',
      paidAt: '2026-03-18T09:30:00+09:00',
    },
    {
      expenseId: 2,
      title: '엔젤리너스',
      participantCount: 4,
      totalAmount: 60000,
      status: 'REQUESTED',
      inputType: 'OCR',
      paidAt: '2026-03-16T18:10:00+09:00',
    },
    {
      expenseId: 3,
      title: '스터디룸 대관',
      participantCount: 5,
      totalAmount: 75000,
      status: 'SETTLED',
      inputType: 'MANUAL',
      paidAt: '2026-03-13T21:00:00+09:00',
    },
  ],
};

/**
 * 상세 화면에서는 목록보다 더 많은 정보가 필요하므로 expenseId 기준 mock detail을 별도 보관한다.
 */
const MOCK_EXPENSE_DETAILS: Record<
  number,
  Omit<MyExpenseDetail, keyof MyExpenseItem>
> = {
  1: {
    storeName: '역삼동 고기집',
    memo: '회식 1차 결제입니다. 삼겹살 4인분과 냉면, 음료가 포함되어 있습니다.',
    participants: [
      { userId: 1, userName: '강산천', splitAmount: 40000, isRequester: true, isSettled: false },
      { userId: 2, userName: '김도윤', splitAmount: 40000, isRequester: false, isSettled: false },
      { userId: 3, userName: '이서연', splitAmount: 40000, isRequester: false, isSettled: false },
    ],
    lineItems: [
      {
        itemId: 101,
        name: '삼겹살 세트',
        quantity: 2,
        amount: 84000,
        assignedParticipants: ['강산천', '김도윤', '이서연'],
      },
      {
        itemId: 102,
        name: '물냉면',
        quantity: 3,
        amount: 24000,
        assignedParticipants: ['강산천', '김도윤', '이서연'],
      },
      {
        itemId: 103,
        name: '음료',
        quantity: 2,
        amount: 12000,
        assignedParticipants: ['강산천', '이서연'],
      },
    ],
  },
  2: {
    storeName: '엔젤리너스 선릉점',
    memo: '카페 정산 요청까지 보낸 상태입니다. OCR 인식 기반으로 품목을 정리했습니다.',
    participants: [
      { userId: 1, userName: '강산천', splitAmount: 15000, isRequester: true, isSettled: false },
      { userId: 2, userName: '박민수', splitAmount: 15000, isRequester: false, isSettled: true },
      { userId: 3, userName: '최가은', splitAmount: 15000, isRequester: false, isSettled: false },
      { userId: 4, userName: '한지민', splitAmount: 15000, isRequester: false, isSettled: false },
    ],
    lineItems: [
      {
        itemId: 201,
        name: '아메리카노',
        quantity: 3,
        amount: 18000,
        assignedParticipants: ['강산천', '박민수', '최가은'],
      },
      {
        itemId: 202,
        name: '카페라떼',
        quantity: 1,
        amount: 6500,
        assignedParticipants: ['한지민'],
      },
      {
        itemId: 203,
        name: '치즈케이크',
        quantity: 2,
        amount: 35500,
        assignedParticipants: ['강산천', '최가은', '한지민'],
      },
    ],
  },
  3: {
    storeName: '스터디룸 예약',
    memo: '수기 입력으로 등록한 공간 대관비입니다. 정산은 모두 완료된 상태입니다.',
    participants: [
      { userId: 1, userName: '강산천', splitAmount: 15000, isRequester: true, isSettled: true },
      { userId: 2, userName: '서현우', splitAmount: 15000, isRequester: false, isSettled: true },
      { userId: 3, userName: '정다인', splitAmount: 15000, isRequester: false, isSettled: true },
      { userId: 4, userName: '오예린', splitAmount: 15000, isRequester: false, isSettled: true },
      { userId: 5, userName: '유재민', splitAmount: 15000, isRequester: false, isSettled: true },
    ],
    lineItems: [],
  },
};

/**
 * 각 입력 방식별 화면에서 어떤 필드를 먼저 만들어야 하는지 보여주는 mock 설명 데이터.
 */
const MOCK_ENTRY_PREVIEWS: Record<ExpenseInputType, PaymentEntryPreview> = {
  ACCOUNT_HISTORY: {
    inputType: 'ACCOUNT_HISTORY',
    title: '계좌 내역',
    headline: '거래 내역을 불러와 결제안 후보를 선택하는 화면',
    description:
      '백엔드 계좌 내역 API가 붙기 전까지는 어떤 필터와 선택 흐름이 필요한지 프론트 구조를 먼저 검토합니다.',
    fieldGuides: [
      { label: '조회 기간', value: '최근 7일 / 최근 1개월 / 직접 설정' },
      { label: '계좌 선택', value: '주계좌 1개 기준, 다계좌 확장은 추후 검토' },
      { label: '후보 필터', value: '입금/출금, 키워드, 금액 범위' },
    ],
    checklist: [
      '거래 내역 카드에서 결제 후보를 여러 건 선택할 수 있어야 합니다.',
      '이미 등록된 expense와 중복되지 않도록 확인 문구가 필요합니다.',
      '선택 후 제목/금액/참여자 편집 단계로 자연스럽게 이어져야 합니다.',
    ],
    primaryActionLabel: '거래 내역 목업 확인',
  },
  OCR: {
    inputType: 'OCR',
    title: '영수증 스캔',
    headline: 'OCR 결과를 수정하고 품목별 분담을 구성하는 화면',
    description:
      '영수증 업로드와 OCR 응답이 아직 없으므로, 결과 보정 UI와 품목 분배 테이블을 미리 잡습니다.',
    fieldGuides: [
      { label: '이미지 입력', value: '카메라 촬영 / 갤러리 업로드' },
      { label: '인식 결과 보정', value: '상호명, 일시, 총액, 품목명 수정' },
      { label: '분배 방식', value: '균등 분배 / 품목별 직접 배분' },
    ],
    checklist: [
      'OCR 실패 시 직접 입력으로 전환하는 fallback이 필요합니다.',
      '품목별 수량/금액을 수정해도 총합 검증이 유지되어야 합니다.',
      '참여자별 splitAmount와 품목 합계가 일치하는지 검증 메시지가 필요합니다.',
    ],
    primaryActionLabel: 'OCR 결과 목업 확인',
  },
  MANUAL: {
    inputType: 'MANUAL',
    title: '직접 입력',
    headline: '제목, 금액, 참여자 정보를 수기로 입력하는 기본 등록 화면',
    description:
      '가장 먼저 실제 등록 폼으로 발전시킬 후보입니다. splitAmount 검증과 기본 필드 배치를 먼저 고정합니다.',
    fieldGuides: [
      { label: '필수 필드', value: '제목, 총액, 결제일시, 참여자' },
      { label: '고급 필드', value: '품목 추가, 메모, 이미지 첨부' },
      { label: '검증 포인트', value: '참여자 splitAmount 합계 = totalAmount' },
    ],
    checklist: [
      '참여자 추가/삭제가 쉬워야 합니다.',
      '입력 중 총액과 분배 금액 차이를 즉시 보여줘야 합니다.',
      '등록 완료 후 내 결제 목록과 자연스럽게 연결되어야 합니다.',
    ],
    primaryActionLabel: '직접 입력 목업 확인',
  },
};

const MOCK_NETWORK_DELAY_MS = 250;

/**
 * 실제 API를 호출할 때 로딩 UI가 어떻게 보일지 미리 확인하려고 짧은 지연을 둔다.
 */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * raw response를 화면용 domain 타입으로 바꾸는 매퍼.
 * 여기서 날짜 문자열/optional 필드 보정을 모두 끝내면,
 * ViewModel과 Screen은 이후부터 단순해진다.
 */
const toMyExpenseItem = (
  expense: MyExpenseListResponse['data'][number],
): MyExpenseItem => ({
  expenseId: expense.expenseId,
  title: expense.title,
  participantCount: expense.participantCount,
  totalAmount: expense.totalAmount,
  status: expense.status ?? 'PENDING',
  inputType: expense.inputType ?? 'MANUAL',
  paidAt: expense.paidAt != null ? new Date(expense.paidAt) : null,
});

/**
 * mock 목록도 실 API와 같은 방식으로 검증하고 정제해 사용한다.
 */
const buildMyExpenseItems = (): MyExpenseItem[] => {
  const validated = myExpenseListResponseSchema.parse(MOCK_MY_EXPENSES);
  return validated.data.map(toMyExpenseItem);
};

/**
 * room별 "내 결제 목록" 조회.
 * 지금은 roomId를 실제로 쓰지 않지만, 나중에 endpoint로 바꾸면 이 인자를 그대로 사용한다.
 */
export const getMyExpenses = async (roomId: number): Promise<MyExpenseItem[]> => {
  void roomId;

  // TODO: Replace mock data with axiosClient.get(`/api/v1/rooms/${roomId}/expenses/me`)
  // once the payment API from the synced backend branch is reflected in this workspace.
  await wait(MOCK_NETWORK_DELAY_MS);
  return buildMyExpenseItems();
};

/**
 * 결제 상세 조회 mock.
 * 실제 API가 생기면 detail endpoint 호출로 대체할 자리다.
 */
export const getExpenseDetail = async (
  expenseId: number,
): Promise<MyExpenseDetail> => {
  await wait(MOCK_NETWORK_DELAY_MS);

  const expense = buildMyExpenseItems().find(
    (candidate) => candidate.expenseId === expenseId,
  );
  const detail = MOCK_EXPENSE_DETAILS[expenseId];

  if (expense == null || detail == null) {
    throw new Error('상세내역 mock 데이터를 찾지 못했습니다.');
  }

  return {
    ...expense,
    ...detail,
  };
};

/**
 * 입력 방식별 화면 설명 mock.
 * 아직 서버 응답이 없으므로 동기 데이터로 먼저 반환한다.
 */
export const getPaymentEntryPreview = (
  inputType: ExpenseInputType,
): PaymentEntryPreview => MOCK_ENTRY_PREVIEWS[inputType];
