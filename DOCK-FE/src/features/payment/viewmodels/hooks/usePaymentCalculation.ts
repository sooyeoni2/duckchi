import { useState, useCallback, useMemo } from 'react';

export interface CalculationParticipant {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  splitAmount: number;
}

interface UsePaymentCalculationProps {
  initialTotalAmount?: number;
  initialParticipants?: CalculationParticipant[];
  payerId: number; // 자투리 금액을 부담할 결제자(생성자) ID
}

/**
 * 🧮 결제 금액 분배 및 검증 전용 커스텀 훅
 */
export const usePaymentCalculation = ({
  initialTotalAmount = 0,
  initialParticipants = [],
  payerId,
}: UsePaymentCalculationProps) => {
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount);
  const [participants, setParticipants] = useState<CalculationParticipant[]>(initialParticipants);

  // 1. 현재 분담 금액의 총합 계산
  const currentSum = useMemo(
    () => participants.reduce((acc, p) => acc + p.splitAmount, 0),
    [participants]
  );

  // 2. 결제 총액과 분담 합계의 차액 (0이어야 정상)
  const difference = useMemo(() => totalAmount - currentSum, [totalAmount, currentSum]);

  // 3. 정산 준비 완료 여부 (차액 0 & 참여자 1명 이상)
  const isReadyToSubmit = useMemo(
    () => totalAmount > 0 && participants.length > 0 && difference === 0,
    [totalAmount, participants.length, difference]
  );

  /**
   * ⚖️ 균등 분배 (N-빵) 실행
   * - 자투리 금액은 payerId를 가진 사용자에게 부과
   */
  const splitEqually = useCallback(() => {
    if (participants.length === 0 || totalAmount <= 0) return;

    const count = participants.length;
    const baseAmount = Math.floor(totalAmount / count); // 내림 처리
    const remainder = totalAmount % count; // 자투리 금액 (나머지)

    const nextParticipants = participants.map((p) => {
      let amount = baseAmount;
      
      // 자투리 금액 처리: 결제자(payerId)인 경우 나머지를 모두 더함
      if (p.userId === payerId) {
        amount += remainder;
      }

      return { ...p, splitAmount: amount };
    });

    // 만약 참여자 명단에 결제자가 없는 예외 케이스라면, 첫 번째 사람에게 부과
    const isPayerInList = participants.some((p) => p.userId === payerId);
    if (!isPayerInList && remainder > 0) {
      nextParticipants[0].splitAmount += remainder;
    }

    setParticipants(nextParticipants);
  }, [participants, totalAmount, payerId]);

  /**
   * ✍️ 특정 참여자의 금액 수동 수정
   */
  const updateParticipantAmount = useCallback((userId: number, amount: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, splitAmount: amount } : p))
    );
  }, []);

  /**
   * ➕ 참여자 목록 전체 업데이트
   */
  const updateParticipantsList = useCallback((newList: CalculationParticipant[]) => {
    setParticipants(newList);
  }, []);

  return {
    totalAmount,
    setTotalAmount,
    participants,
    difference,
    isReadyToSubmit,
    splitEqually,
    updateParticipantAmount,
    updateParticipantsList,
    currentSum,
  };
};
