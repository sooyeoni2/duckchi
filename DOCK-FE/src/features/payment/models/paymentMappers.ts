import type {
  AccountHistoryItem,
  ExpenseInputType,
  ExpenseStatus,
  MyExpenseDetail,
  MyExpenseItem,
  OcrReceiptItem,
} from './paymentTypes';
import type { z } from 'zod';
import {
  accountHistorySchema,
  expenseDetailSchema,
  expenseSummarySchema,
  ocrDraftSchema,
} from './paymentTypes';

type AccountHistoryDto = z.infer<typeof accountHistorySchema>;
type ExpenseSummaryDto = z.infer<typeof expenseSummarySchema>;
type ExpenseDetailDto = z.infer<typeof expenseDetailSchema>;
type OcrDraftDto = z.infer<typeof ocrDraftSchema>;

/**
 * 안전한 날짜 변환 헬퍼
 */
function toDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 내 결제 목록 DTO -> FE 모델 변환
 */
export const toMyExpenseItem = (dto: ExpenseSummaryDto): MyExpenseItem => ({
  expenseId: dto.expenseId,
  roomSessionId: dto.roomSessionId ?? null,
  title: dto.title,
  totalAmount: dto.totalAmount,
  payerUserName: dto.payerUserName ?? '알 수 없음',
  status: (dto.status as ExpenseStatus) || 'PENDING',
  inputType: (dto.inputType as ExpenseInputType) || 'MANUAL',
  paidAt: toDate(dto.paidAt),
  createdAt: toDate(dto.createdAt),
});

/**
 * 결제 상세 DTO -> FE 모델 변환
 */
export const toMyExpenseDetail = (dto: ExpenseDetailDto): MyExpenseDetail => {
  const base = {
    expenseId: dto.expenseId,
    roomSessionId: 1, // 상세 DTO에 roomSessionId가 없는 경우 기본값
    title: dto.title,
    totalAmount: dto.totalAmount,
    payerUserName: dto.payerUserName ?? '알 수 없음',
    status: 'PENDING' as ExpenseStatus, // 상세 DTO에 status가 없는 경우 기본값
    inputType: dto.inputType as ExpenseInputType,
    paidAt: toDate(dto.paidAt),
    createdAt: null, // 상세 DTO에 createdAt이 없는 경우
    participantCount: dto.participants.length, // 추가됨
  };

  return {
    ...base,
    storeName: dto.payerUserName || '상점 정보 없음',
    memo: '',
    participants: dto.participants.map(p => ({
      userId: p.userId,
      userName: p.userName,
      splitAmount: p.splitAmount,
      isRequester: p.userId === dto.payerUserId,
      isSettled: false,
    })),
    lineItems: dto.items.map((item, index) => ({
      itemId: index + 1,
      name: item.name,
      quantity: item.quantity,
      amount: item.totalAmount,
      assignedParticipants: item.itemParticipants.map(ip => ip.userName),
      assignmentDetails: item.itemParticipants.map(ip => ({
        userId: ip.userId,
        userName: ip.userName,
        quantity: ip.quantity,
        amount: ip.splitAmount,
      })),
    })),
  };
};

/**
 * 계좌 거래 내역 DTO -> FE 모델 변환
 */
export const toAccountHistoryItem = (dto: AccountHistoryDto, index: number): AccountHistoryItem => ({
  id: `history-${index}`,
  historyId: `history-${index}`, // UI 컴포넌트 key 대응
  transactionMemo: dto.transactionMemo,
  amount: dto.amount,
  date: new Date(dto.transactionAt),
  transactionAt: dto.transactionAt, // UI 표시용 원본 날짜
});

/**
 * OCR 결과 DTO -> FE 모델 변환
 */
export const toOcrReceiptItem = (dto: OcrDraftDto): OcrReceiptItem => ({
  title: dto.title,
  totalAmount: dto.totalAmount,
  paidAt: toDate(dto.paidAt),
  items: dto.items?.map(item => ({
    name: item.name,
    amount: item.totalAmount,
    quantity: item.quantity,
  })) || [],
});
