import type { MyExpenseItem } from './paymentTypes';

export type PaymentExpenseStatusTone = 'pending' | 'requested' | 'settled';

interface PaymentExpenseStatusMeta {
  label: '대기' | '진행중' | '완료';
  tone: PaymentExpenseStatusTone;
}

const STATUS_META: Record<MyExpenseItem['status'], PaymentExpenseStatusMeta> = {
  PENDING: { label: '대기', tone: 'pending' },
  REQUESTED: { label: '진행중', tone: 'requested' },
  SETTLED: { label: '완료', tone: 'settled' },
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getExpenseStatusMeta(
  status: MyExpenseItem['status'],
): PaymentExpenseStatusMeta {
  return STATUS_META[status];
}

export function getExpensePrimaryDisplayDate(
  expense: Pick<MyExpenseItem, 'status' | 'createdAt' | 'completedAt'>,
): Date | null {
  if (expense.status === 'SETTLED' && expense.completedAt != null) {
    return expense.completedAt;
  }

  return expense.createdAt;
}

export function formatExpenseListDate(date: Date | null): string {
  if (date == null) {
    return '시간 미정';
  }

  const now = new Date();
  const isSameYear = now.getFullYear() === date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());

  if (!isSameYear) {
    return `${date.getFullYear()}.${month}.${day}`;
  }

  return `${month}.${day} ${hour}:${minute}`;
}

export function formatExpenseTotalAmount(amount: number): string {
  return `총 ${amount.toLocaleString('ko-KR')}원`;
}
