import {
  createExpenseApi,
  deleteExpenseApi,
  fetchAccountHistoriesApi,
  fetchExpenseDetailApi,
  fetchExpenseParticipantsApi,
  fetchMyExpensesApi,
  fetchOcrAnalysisApi,
  getPaymentErrorMessage,
  updateExpenseApi,
} from './paymentApi';
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
} from './paymentTypes';

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
  return {
    roomSessionId: typeof roomId === 'string' ? parseInt(roomId) : roomId,
    historyId: 'mock-history-id',
    transactionMemo: 'Mock 거래 내역',
    transactionAt: new Date().toISOString(),
    title: '',
    totalAmount: 0,
    participants: [
      { userId: 1, userName: '박성환', isSelected: true, splitAmount: 0 },
      { userId: 2, userName: '정우주', isSelected: true, splitAmount: 0 },
      { userId: 3, userName: '류병선 (나)', isSelected: true, splitAmount: 0 },
    ],
    selectedHistoryIds: [],
  };
};

/**
 * --------------------------------------------------------------------------
 * 직접 입력 초안 조회 서비스 (Mock)
 * --------------------------------------------------------------------------
 */
export const getManualEntryDraft = async (roomId: number | string): Promise<ManualEntryDraft> => {
  // 실제 서비스 구현 전까지는 Mock 데이터 반환
  return {
    roomSessionId: typeof roomId === 'string' ? parseInt(roomId) : roomId,
    title: '',
    totalAmount: 0,
    participants: [
      { userId: 1, userName: '박성환', isSelected: true, splitAmount: 0 },
      { userId: 2, userName: '정우주', isSelected: true, splitAmount: 0 },
      { userId: 3, userName: '류병선 (나)', isSelected: true, splitAmount: 0 },
      { userId: 4, userName: '김수연', isSelected: false, splitAmount: 0 },
    ],
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
 * 결제 상세 조회 서비스 (PAY-05)
 * --------------------------------------------------------------------------
 */
export const getExpenseDetail = async (
  expenseId: number,
  roomId: number | string = 1 // roomId를 선택적으로 받고 기본값을 1로 설정
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
export const getAccountHistories = async (accountNo?: string): Promise<AccountHistoryItem[]> => {
  try {
    const dtos = await fetchAccountHistoriesApi(accountNo);
    return dtos.map((dto, index) => toAccountHistoryItem(dto, index));
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
