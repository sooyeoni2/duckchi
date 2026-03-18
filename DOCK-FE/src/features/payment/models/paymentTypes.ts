import { z } from 'zod';

/**
 * 결제 목록이 가질 수 있는 상태값.
 * .ai 문서 기준으로 아직 요청 전(PENDING), 정산 요청됨(REQUESTED), 완료(SETTLED)만 먼저 다룬다.
 */
export const expenseStatusSchema = z.enum(['PENDING', 'REQUESTED', 'SETTLED']);

/**
 * 결제 등록 진입 방식.
 * 이후 계좌내역/영수증 OCR/직접 입력 화면을 각각 붙일 때 공통 기준점으로 사용한다.
 */
export const expenseInputTypeSchema = z.enum([
  'MANUAL',
  'ACCOUNT_HISTORY',
  'OCR',
]);

/**
 * PAY-05 "내 결제 목록" 응답 한 건을 검증하는 스키마.
 * 현재 워크스페이스의 백엔드 반영이 늦어져 있을 수 있어서,
 * 문서에 없는 필드는 optional로 두고 화면용 타입에서 보정한다.
 */
const myExpenseItemSchema = z.object({
  expenseId: z.number(),
  title: z.string(),
  participantCount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  status: expenseStatusSchema.optional(),
  inputType: expenseInputTypeSchema.optional(),
  paidAt: z.string().optional(),
});

/**
 * 목록 API의 전체 응답 형태.
 * 현재는 success/data 구조를 그대로 가정한다.
 */
export const myExpenseListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(myExpenseItemSchema),
});

/**
 * raw response 타입.
 * service 내부에서 "백엔드가 보내준 원본"을 다룰 때 쓴다.
 */
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type ExpenseInputType = z.infer<typeof expenseInputTypeSchema>;
export type MyExpenseListResponse = z.infer<typeof myExpenseListResponseSchema>;

/**
 * 화면과 ViewModel이 사용하는 정제된 타입.
 * - 날짜 문자열은 Date로 바꾼다.
 * - optional 필드는 service에서 fallback을 적용해 항상 채워진 상태로 맞춘다.
 */
export interface MyExpenseItem {
  expenseId: number;
  title: string;
  participantCount: number;
  totalAmount: number;
  status: ExpenseStatus;
  inputType: ExpenseInputType;
  paidAt: Date | null;
}

/**
 * 목록 화면 상단 필터에 쓰는 값.
 * 전체 보기(ALL)는 실제 API 상태값이 아니고, FE 전용 필터 옵션이다.
 */
export type ExpenseStatusFilter = 'ALL' | ExpenseStatus;

/**
 * 결제 등록/수정 화면에서 참여자별 분담값을 담기 위한 draft 타입.
 * 지금은 목록 skeleton 단계지만, 이후 PAY-04 등록 화면으로 확장할 것을 대비해 같이 정리했다.
 */
export interface ExpenseParticipantDraft {
  userId: number;
  splitAmount: number;
  userName?: string;
  userTag?: string;
  profileImageUrl?: string | null;
}

/**
 * 메뉴별 분배 시, 특정 품목을 누가 얼마씩 부담하는지 담는 draft 타입.
 */
export interface ExpenseItemSplitDraft {
  userId: number;
  splitAmount: number;
  quantity?: number;
}

/**
 * OCR/직접입력 상세 품목을 표현하는 draft 타입.
 */
export interface ExpenseItemDraft {
  name: string;
  totalAmount: number;
  quantity: number;
  splits: ExpenseItemSplitDraft[];
}

/**
 * PAY-04 결제 등록 요청 body의 FE 기준 초안.
 * 실제 백엔드 반영이 이 워크스페이스에 들어오면 이 타입을 먼저 맞추면 된다.
 */
export interface CreateExpenseRequest {
  roomSessionId: number;
  inputType: ExpenseInputType;
  title: string;
  totalAmount: number;
  paidAt: string;
  receiptImageUrl?: string | null;
  participants: ExpenseParticipantDraft[];
  items?: ExpenseItemDraft[];
}
