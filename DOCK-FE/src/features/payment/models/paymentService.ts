import type { MyExpenseItem, MyExpenseListResponse } from './paymentTypes';
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
      title: '한우마당',
      participantCount: 3,
      totalAmount: 120000,
      status: 'PENDING',
      inputType: 'ACCOUNT_HISTORY',
      paidAt: '2026-03-18T09:30:00+09:00',
    },
    {
      expenseId: 2,
      title: '올리브샐러드',
      participantCount: 4,
      totalAmount: 68000,
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
 * room별 "내 결제 목록" 조회.
 * 지금은 roomId를 실제로 쓰지 않지만, 나중에 endpoint로 바꾸면 이 인자를 그대로 사용한다.
 */
export const getMyExpenses = async (roomId: number): Promise<MyExpenseItem[]> => {
  void roomId;

  // TODO: Replace mock data with axiosClient.get(`/api/v1/rooms/${roomId}/expenses/me`)
  // once the payment API from the synced backend branch is reflected in this workspace.
  await wait(MOCK_NETWORK_DELAY_MS);

  // mock도 API와 같은 방식으로 검증해야 나중에 실데이터로 바꿀 때 충격이 적다.
  const validated = myExpenseListResponseSchema.parse(MOCK_MY_EXPENSES);
  return validated.data.map(toMyExpenseItem);
};
