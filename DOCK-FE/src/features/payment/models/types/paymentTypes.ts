import { z } from 'zod';

/**
 * --------------------------------------------------------------------------
 * 1. API 응답 스키마 (Zod) - 백엔드 명세 기준
 * --------------------------------------------------------------------------
 */

// 공통 응답 래퍼
export const paymentApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    msg: z.string().optional().nullable(),
    errorCode: z.string().optional().nullable(),
  });

// 결제 상태 및 입력 방식
export const expenseStatusSchema = z.enum(['PENDING', 'REQUESTED', 'SETTLED']);
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type ExpenseStatusFilter = ExpenseStatus | 'ALL';

export const expenseInputTypeSchema = z.enum(['MANUAL', 'ACCOUNT_HISTORY', 'OCR']);
export type ExpenseInputType = z.infer<typeof expenseInputTypeSchema>;

// PAY-05: 내 결제 목록 항목 DTO
export const expenseSummarySchema = z.object({
  expenseId: z.number(),
  roomSessionId: z.number().optional().nullable(),
  title: z.string(),
  totalAmount: z.number(),
  payerUserName: z.string().optional().nullable(),
  inputType: expenseInputTypeSchema.optional().nullable(),
  status: expenseStatusSchema.optional().nullable(),
  paidAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

// PAY-05: 결제 상세 응답 스키마 DTO
export const participantDetailSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  userTag: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  splitAmount: z.number(),
});

export const itemParticipantDetailSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  userTag: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  splitAmount: z.number(),
  quantity: z.number(),
});

export const itemDetailSchema = z.object({
  name: z.string(),
  totalAmount: z.number(),
  quantity: z.number(),
  itemParticipants: z.array(itemParticipantDetailSchema),
});

export const expenseDetailSchema = z.object({
  expenseId: z.number(),
  title: z.string(),
  totalAmount: z.number(),
  paidAt: z.string().optional().nullable(),
  payerUserName: z.string().optional().nullable(),
  payerUserId: z.number().optional().nullable(),
  inputType: expenseInputTypeSchema,
  status: expenseStatusSchema.optional().nullable(),
  participants: z.array(participantDetailSchema),
  items: z.array(itemDetailSchema),
});

// PAY-01: 계좌 거래 내역 DTO
export const accountHistorySchema = z.object({
  transactionMemo: z.string(),
  amount: z.number(),
  transactionAt: z.string(),
});

// PAY-03: OCR 결과 (Draft) DTO
export const ocrDraftItemSchema = z.object({
  name: z.string(),
  totalAmount: z.number(),
  quantity: z.number(),
});

export const ocrDraftSchema = z.object({
  title: z.string(),
  totalAmount: z.number(),
  paidAt: z.string().optional().nullable(),
  items: z.array(ocrDraftItemSchema).optional().nullable(),
});

/**
 * --------------------------------------------------------------------------
 * 2. FE 내부 사용 타입 (App Model)
 * --------------------------------------------------------------------------
 */

// 내 결제 항목 (정제됨)
export interface MyExpenseItem {
  expenseId: number;
  roomSessionId: number | null;
  title: string;
  totalAmount: number;
  payerUserName: string;
  status: ExpenseStatus;
  inputType: ExpenseInputType;
  paidAt: Date | null;
  createdAt: Date | null;
  completedAt?: Date | null; // UI 정렬/표시용
  participantCount?: number;
}

// 계좌 거래 내역 항목 (정제됨)
export interface AccountHistoryItem {
  id: string; // FE 생성 ID
  historyId?: string; // 컴포넌트 호환용
  transactionMemo: string;
  amount: number;
  date: Date;
  transactionAt?: string; // 컴포넌트 호환용
}

// OCR 영수증 데이터 (정제됨)
export interface OcrReceiptItem {
  title: string;
  totalAmount: number;
  paidAt: Date | null;
  items: OcrLineItem[];
}

export interface OcrLineItem {
  name: string;
  amount: number;
  quantity: number;
}

/**
 * UI 구성요소(PaymentExpenseDetailView 등)를 위한 상세 타입
 */

export interface ExpenseParticipantPreview {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  splitAmount: number;
  isRequester: boolean;
  isSettled: boolean;
}

export interface ExpenseLineItemPreview {
  itemId: number;
  name: string;
  quantity: number;
  amount: number;
  assignedParticipants: string[];
  assignmentDetails?: ExpenseLineItemAssignmentDetail[];
}

export interface ExpenseLineItemAssignmentDetail {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  quantity: number;
  amount: number;
}

export interface ExpenseSourceInfoRow {
  label: string;
  value: string;
}

// 결제 상세 내역 (UI에서 사용하는 최종 형태)
export interface MyExpenseDetail extends MyExpenseItem {
  storeName: string;
  memo: string;
  participants: ExpenseParticipantPreview[];
  lineItems: ExpenseLineItemPreview[];
  sourceInfoRows?: ExpenseSourceInfoRow[];
}

/**
 * --------------------------------------------------------------------------
 * 3. 직접 입력 및 OCR 드래프트 (UI Draft Models)
 * --------------------------------------------------------------------------
 */

// 직접 입력 초안
export interface ManualEntryParticipant {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  isSelected: boolean;
  splitAmount: number;
}

export interface ManualEntryDraft {
  expenseId?: number | null;
  roomSessionId: number;
  title: string;
  totalAmount: number;
  paidAt?: string | null;
  participants: ManualEntryParticipant[];
}
// 계좌 내역 기반 정산 초안
export interface AccountHistoryEntryDraft {
  roomSessionId: number;
  historyId: string; // 추가됨
  transactionMemo: string; // 추가됨
  transactionAt: string; // 추가됨
  title: string;
  totalAmount: number;
  participants: ManualEntryParticipant[];
  selectedHistoryIds: string[];
}

/**
 * OCR 영수증 드래프트 관련
 */

export type OcrImageSource = 'CAMERA' | 'LIBRARY';
export type OcrFailureType = 'RECEIPT_UNREADABLE' | 'ITEMS_UNREADABLE' | 'NETWORK_ERROR';
export type OcrAssignMode = 'MANUAL_SPLIT' | 'QUANTITY_SPLIT' | 'EQUAL_SPLIT' | 'PERSON' | 'QUANTITY';
export type OcrSplitMode = 'TOTAL' | 'ITEM';

export interface OcrParticipantDraft {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  isSelected: boolean;
  isMe: boolean;
  splitAmount: number;
}

export interface OcrLineItemDraft {
  itemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  assignment: OcrLineItemAssignment | null;
}

export interface OcrLineItemAssignment {
  mode: OcrAssignMode;
  participantUserIds: number[];
  quantityAllocations?: OcrItemQuantityAllocation[];
}

export interface OcrItemQuantityAllocation {
  userId: number;
  quantity: number;
}

export interface OcrReceiptDraft {
  imageUri: string;
  storeName: string;
  paidAt: Date | null;
  totalAmount: number;
  splitMode: OcrSplitMode;
  participants: OcrParticipantDraft[];
  items: OcrLineItemDraft[];
}

export interface OcrReceiptSummary {
  imageUri: string;
  storeName: string;
  paidAt: Date | null;
  totalAmount: number;
  participants: OcrParticipantDraft[];
}

export type OcrRecognitionResult = 
  | { kind: 'SUCCESS'; draft: OcrReceiptDraft }
  | { kind: 'ITEMS_UNREADABLE'; summary: OcrReceiptSummary }
  | { kind: 'FAILURE'; failureType: OcrFailureType };

/**
 * 미리보기 가이드 타입
 */
export interface PaymentEntryPreview {
  title: string;
  headline?: string; // 추가됨
  description: string;
  primaryActionLabel?: string; // 추가됨
  fieldGuides: Array<{
    label: string;
    description: string;
    value?: string; // 추가됨
  }>;
  checklist: string[];
}

/**
 * --------------------------------------------------------------------------
 * 4. API 요청 타입 (Request DTO)
 * --------------------------------------------------------------------------
 */

export interface ExpenseUpsertRequest {
  roomSessionId: number;
  title: string;
  totalAmount: number;
  paidAt?: string;
  receiptImageUrl?: string;
  inputType: ExpenseInputType;
  participants: Array<{
    userId: number;
    splitAmount: number;
  }>;
  items?: Array<{
    name: string;
    totalAmount: number;
    quantity: number;
    splits?: Array<{
      userId: number;
      splitAmount: number;
      quantity: number;
    }>;
  }>;
}
