export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}
