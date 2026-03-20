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
  roomSessionId: z.number().optional(),
  title: z.string(),
  participantCount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  payerUserName: z.string().optional(),
  status: expenseStatusSchema.optional(),
  inputType: expenseInputTypeSchema.optional(),
  paidAt: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional().nullable(),
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
 * 계좌 거래 내역 한 건을 검증하는 스키마.
 * 백엔드 AccountHistoryResponse 구조를 그대로 따라가고,
 * historyId 같은 화면 전용 식별자는 service 계층에서 별도로 붙인다.
 */
const accountHistoryItemResponseSchema = z.object({
  transactionMemo: z.string(),
  amount: z.number().int().nonnegative(),
  transactionAt: z.string(),
});

/**
 * 계좌 거래 내역 목록 응답.
 * 현재 mock도 success/data 구조를 유지해 실제 API 교체 비용을 줄인다.
 */
export const accountHistoryListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(accountHistoryItemResponseSchema),
});

/**
 * raw response 타입.
 * service 내부에서 "백엔드가 보내준 원본"을 다룰 때 쓴다.
 */
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type ExpenseInputType = z.infer<typeof expenseInputTypeSchema>;
export type MyExpenseListResponse = z.infer<typeof myExpenseListResponseSchema>;
export type AccountHistoryListResponse = z.infer<
  typeof accountHistoryListResponseSchema
>;

/**
 * 화면과 ViewModel이 사용하는 정제된 타입.
 * - 날짜 문자열은 Date로 바꾼다.
 * - optional 필드는 service에서 fallback을 적용해 항상 채워진 상태로 맞춘다.
 */
export interface MyExpenseItem {
  expenseId: number;
  roomSessionId: number | null;
  title: string;
  participantCount: number;
  totalAmount: number;
  payerUserName: string;
  status: ExpenseStatus;
  inputType: ExpenseInputType;
  paidAt: Date | null;
  createdAt: Date | null;
  completedAt?: Date | null;
}

/**
 * 목록 화면 상단 필터에 쓰는 값.
 * 전체 보기(ALL)는 실제 API 상태값이 아니고, FE 전용 필터 옵션이다.
 */
export type ExpenseStatusFilter = 'ALL' | ExpenseStatus;

/**
 * 결제 상세 화면에서 참여자 분담 정보를 표현하는 타입.
 * 이후 정산 요청/완료 상태를 붙일 때 그대로 확장할 수 있게 분리했다.
 */
export interface ExpenseParticipantPreview {
  userId: number;
  userName: string;
  splitAmount: number;
  isRequester: boolean;
  isSettled: boolean;
}

/**
 * 영수증/OCR/수기 입력 결과를 상세 화면에서 보여줄 세부 품목 타입.
 */
export interface ExpenseLineItemPreview {
  itemId: number;
  name: string;
  quantity: number;
  amount: number;
  assignedParticipants: string[];
}

/**
 * 입력 방식별 원본 정보나 부가 정보를 상세 화면에서 행 단위로 보여주기 위한 타입.
 * OCR만 품목 배열을 쓰고, 계좌 내역/직접 입력은 이런 key-value 정보 위주로 노출한다.
 */
export interface ExpenseSourceInfoRow {
  label: string;
  value: string;
}

/**
 * 결제 상세 화면에서 사용하는 확장 타입.
 * 목록에는 없는 부가 설명, 참여자, 품목 정보를 mock으로 먼저 채운다.
 */
export interface MyExpenseDetail extends MyExpenseItem {
  storeName: string;
  memo: string;
  participants: ExpenseParticipantPreview[];
  lineItems: ExpenseLineItemPreview[];
  sourceInfoRows?: ExpenseSourceInfoRow[];
}

/**
 * 각 입력 진입 화면에서 어떤 필드를 먼저 구현해야 하는지 보여주기 위한 안내 row.
 */
export interface PaymentEntryGuideField {
  label: string;
  value: string;
}

/**
 * 계좌/OCR/직접입력 진입 화면의 mock 설명 데이터.
 * API 연결 전에도 사용자가 흐름을 리뷰할 수 있게 텍스트와 필드 구성을 담는다.
 */
export interface PaymentEntryPreview {
  inputType: ExpenseInputType;
  title: string;
  headline: string;
  description: string;
  fieldGuides: PaymentEntryGuideField[];
  checklist: string[];
  primaryActionLabel: string;
}

/**
 * 계좌 거래 내역 목록 화면에서 사용하는 정제 타입.
 * 원본 응답에는 id가 없어서, historyId는 FE service에서만 관리한다.
 */
export interface AccountHistoryItem {
  historyId: string;
  transactionMemo: string;
  amount: number;
  transactionAt: Date;
}

/**
 * 계좌 내역을 장바구니 등록 폼으로 넘긴 뒤 토글할 참여자 초안.
 */
export interface AccountHistoryParticipantDraft {
  userId: number;
  userName: string;
  isSelected: boolean;
  isMe: boolean;
  splitAmount: number;
}

/**
 * 계좌 내역 -> 등록 폼으로 넘어가는 순간의 draft 데이터.
 * 거래 원본 필드와 프론트 수정값(itemName, 참여자 선택)을 함께 가진다.
 */
export interface AccountHistoryEntryDraft {
  historyId: string;
  transactionMemo: string;
  amount: number;
  transactionAt: Date;
  itemName: string;
  participants: AccountHistoryParticipantDraft[];
}

/**
 * 직접 입력 흐름에서 사용하는 참여자 초안.
 * 1단계에서는 on/off 토글, 2단계에서는 splitAmount 편집까지 같은 draft로 이어간다.
 */
export interface ManualEntryParticipantDraft {
  userId: number;
  userName: string;
  isSelected: boolean;
  isMe: boolean;
  splitAmount: number;
}

/**
 * 직접 입력 2단계 mock에 사용하는 draft.
 * 장바구니 항목명, 전체 금액, 참여자별 분배 금액을 모두 한 묶음으로 다룬다.
 */
export interface ManualEntryDraft {
  itemName: string;
  totalAmount: number;
  participants: ManualEntryParticipantDraft[];
}

/**
 * OCR 이미지 입력 경로.
 * 실제 기기에서는 카메라 촬영과 갤러리 선택 둘 다 지원한다.
 */
export type OcrImageSource = 'CAMERA' | 'LIBRARY';

/**
 * OCR 결과 이후 분배 방식.
 * TOTAL은 전체 N빵, ITEM은 메뉴별 나누기 흐름이다.
 */
export type OcrSplitMode = 'TOTAL' | 'ITEM';

/**
 * 메뉴 배정 bottom sheet에서 사용하는 분배 방식.
 * PERSON은 선택한 인원끼리 균등, QUANTITY는 수량 기준 분배다.
 */
export type OcrAssignMode = 'PERSON' | 'QUANTITY';

/**
 * OCR 실패 케이스.
 * - RECEIPT_UNREADABLE: 영수증 전체를 읽지 못함
 * - ITEMS_UNREADABLE: 총액은 읽었지만 세부 항목은 읽지 못함
 */
export type OcrFailureType = 'RECEIPT_UNREADABLE' | 'ITEMS_UNREADABLE';

/**
 * OCR 공통 요약 정보.
 * 성공/부분 성공 케이스 모두 같은 기본 정보를 사용한다.
 */
export interface OcrReceiptSummary {
  imageUri: string;
  storeName: string;
  paidAt: Date | null;
  totalAmount: number;
}

/**
 * OCR 흐름에서 참여자 초안.
 * splitAmount는 전체 N빵 미리보기나 최종 계산 결과를 담는다.
 */
export interface OcrParticipantDraft {
  userId: number;
  userName: string;
  isSelected: boolean;
  isMe: boolean;
  splitAmount: number;
}

/**
 * 수량별 나누기에서 사용자별 배정 수량.
 */
export interface OcrItemQuantityAllocation {
  userId: number;
  quantity: number;
}

/**
 * 특정 메뉴가 어떤 방식으로 배정됐는지 나타낸다.
 */
export interface OcrItemAssignmentDraft {
  mode: OcrAssignMode;
  participantUserIds: number[];
  quantityAllocations: OcrItemQuantityAllocation[];
}

/**
 * OCR이 읽어낸 메뉴 한 줄.
 * 단가/수량 수정 시 amount는 FE에서 다시 계산한다.
 */
export interface OcrLineItemDraft {
  itemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  assignment: OcrItemAssignmentDraft | null;
}

/**
 * OCR 성공 시 편집/분배 화면에서 사용하는 전체 draft.
 */
export interface OcrReceiptDraft extends OcrReceiptSummary {
  splitMode: OcrSplitMode;
  participants: OcrParticipantDraft[];
  items: OcrLineItemDraft[];
}

/**
 * OCR mock 인식 결과.
 * 현재는 FE에서 mock 분기를 먼저 다루고, 이후 실제 API 응답으로 교체한다.
 */
export type OcrRecognitionResult =
  | {
      kind: 'SUCCESS';
      draft: OcrReceiptDraft;
    }
  | {
      kind: 'ITEMS_UNREADABLE';
      summary: OcrReceiptSummary;
    }
  | {
      kind: 'RECEIPT_UNREADABLE';
    };

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
