import {
  createExpenseApi,
  deleteExpenseApi,
  fetchAccountHistoriesApi,
  fetchExpenseDetailApi,
  fetchExpenseParticipantsApi,
  fetchMyExpensesApi,
  fetchRoomExpensesApi,
  fetchOcrAnalysisApi,
  getPaymentErrorMessage,
  requestSettlementsApi,
  updateExpenseApi,
} from '../api/paymentApi';
import {
  toAccountHistoryItem,
  toMyExpenseDetail,
  toMyExpenseItem,
  toOcrReceiptItem,
} from './paymentMappers';
import type {
  AccountHistoryEntryDraft,
  AccountHistoryItem,
  ExpenseUpsertRequest,
  ManualEntryDraft,
  MyExpenseDetail,
  MyExpenseItem,
  OcrReceiptItem,
} from '../types/paymentTypes';

/**
 * --------------------------------------------------------------------------
 * 결제 참여 가능 멤버 조회 서비스
 * --------------------------------------------------------------------------
 */
export const getExpenseParticipants = async (roomId: number | string) => {
  try {
    return await fetchExpenseParticipantsApi(roomId);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '참여 멤버 목록을 불러오지 못했습니다.'));
  }
};

// 화면 등에서 기존 이름으로 참조할 수 있도록 재내보내기
export { fetchExpenseParticipantsApi };

/**
 * --------------------------------------------------------------------------
 * 계좌 내역 기반 정산 초안 조회 서비스 (Mock)
 * --------------------------------------------------------------------------
 */
export const getAccountHistoryEntryDraft = async (roomId: number | string): Promise<AccountHistoryEntryDraft> => {
  const participants = await getExpenseParticipants(roomId);
  return {
    roomSessionId: typeof roomId === 'string' ? parseInt(roomId, 10) : roomId,
    historyId: 'mock-history-id',
    transactionMemo: 'Mock 거래 내역',
    transactionAt: new Date().toISOString(),
    title: '',
    totalAmount: 0,
    participants: participants.map((p: any) => ({ ...p, isSelected: true, splitAmount: 0 })),
    selectedHistoryIds: [],
  };
};

/**
 * --------------------------------------------------------------------------
 * 직접 입력 초안 조회 서비스 (Mock)
 * --------------------------------------------------------------------------
 */
export const getManualEntryDraft = async (roomId: number | string): Promise<ManualEntryDraft> => {
  const participants = await getExpenseParticipants(roomId);
  // 직접입력 진입 시 참여자 목록은 실서버 응답으로 초기화하고,
  // 분배 화면에서 금액을 다시 입력하도록 splitAmount는 0으로 시작한다.
  return {
    // roomId와 roomSessionId는 다른 값일 수 있어 여기서 임의 추정하지 않는다.
    roomSessionId: 0,
    title: '',
    totalAmount: 0,
    participants: participants.map((participant: any) => ({
      userId: participant.userId,
      userName: participant.userName,
      isSelected: true,
      splitAmount: 0,
    })),
  };
};

/**
 * --------------------------------------------------------------------------
 * 내 결제 목록 조회 서비스
 * --------------------------------------------------------------------------
 */
export const getMyExpenses = async (roomId: number | string): Promise<MyExpenseItem[]> => {
  try {
    const dtos = await fetchMyExpensesApi(roomId);
    return dtos.map(toMyExpenseItem);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '내 결제 목록을 불러오지 못했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 결제 생성용 roomSessionId 추출
 * --------------------------------------------------------------------------
 */
export const getRoomSessionIdForExpenseCreation = async (
  roomId: number | string,
): Promise<number | null> => {
  try {
    const dtos = await fetchRoomExpensesApi(roomId);
    return (
      dtos.find((dto) => dto.roomSessionId != null && dto.roomSessionId > 0)
        ?.roomSessionId ?? null
    );
  } catch {
    return null;
  }
};

/**
 * --------------------------------------------------------------------------
 * 정산 요청 발송 서비스 (SET-01)
 * --------------------------------------------------------------------------
 */
export const requestSettlements = async (expenseIds: number[]): Promise<void> => {
  if (expenseIds.length === 0) {
    return;
  }

  try {
    await requestSettlementsApi(expenseIds);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '정산 요청에 실패했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 결제 상세 조회 서비스 (PAY-05)
 * --------------------------------------------------------------------------
 */
export const getExpenseDetail = async (
  expenseId: number,
  roomId: number | string
): Promise<MyExpenseDetail> => {
  try {
    const dto = await fetchExpenseDetailApi(roomId, expenseId);
    return toMyExpenseDetail(dto);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '결제 상세 정보를 불러오지 못했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 계좌 거래 내역 조회 서비스 (PAY-01)
 * --------------------------------------------------------------------------
 */
export const getAccountHistories = async (): Promise<AccountHistoryItem[]> => {
  try {
    const dtos = await fetchAccountHistoriesApi();
    return dtos.map((dto: any, index: any) => toAccountHistoryItem(dto, index));
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '계좌 내역을 불러오지 못했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * OCR 영수증 분석 서비스 (PAY-03)
 * --------------------------------------------------------------------------
 * @param imageUrl S3에 업로드된 이미지 URL
 */
export const analyzeReceipt = async (imageUrl: string): Promise<OcrReceiptItem> => {
  try {
    const dto = await fetchOcrAnalysisApi(imageUrl);
    return toOcrReceiptItem(dto);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '영수증 분석에 실패했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 결제안 생성 서비스 (PAY-04)
 * --------------------------------------------------------------------------
 */
export const createExpense = async (
  roomId: number | string, 
  request: ExpenseUpsertRequest
): Promise<number> => {
  try {
    return await createExpenseApi(roomId, request);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '결제안 생성에 실패했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 결제안 수정 서비스 (PAY-07)
 * --------------------------------------------------------------------------
 */
export const updateExpense = async (
  roomId: number | string,
  expenseId: number,
  request: ExpenseUpsertRequest
): Promise<void> => {
  try {
    await updateExpenseApi(roomId, expenseId, request);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '결제안 수정에 실패했습니다.'));
  }
};

/**
 * --------------------------------------------------------------------------
 * 결제안 삭제 서비스 (PAY-06)
 * --------------------------------------------------------------------------
 */
export const deleteExpense = async (roomId: number | string, expenseId: number): Promise<void> => {
  try {
    await deleteExpenseApi(roomId, expenseId);
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error, '결제안 삭제에 실패했습니다.'));
  }
};
