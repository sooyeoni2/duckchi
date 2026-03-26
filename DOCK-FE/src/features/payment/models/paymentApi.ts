import { ENDPOINTS } from '@core/constants/apiConstants';
import { axiosClient } from '@core/network/axiosClient';
import axios from 'axios';
import { z } from 'zod';
import {
  accountHistorySchema,
  expenseSummarySchema,
  expenseDetailSchema,
  ocrDraftSchema,
  paymentApiResponseSchema,
} from './paymentTypes';
import type {
  ExpenseUpsertRequest,
} from './paymentTypes';

/**
 * API 응답 데이터를 언랩(Unwrap)하고 Zod로 검증하는 헬퍼 함수
 */
async function validateAndUnwrap<T extends z.ZodTypeAny>(
  response: any,
  schema: T,
): Promise<z.infer<T>> {
  // 서버 응답 데이터 추출
  const responseData = response.data;
  
  // success 필드가 명확히 true인 경우에만 데이터 반환
  if (responseData && responseData.success === true) {
    const result = schema.safeParse(responseData.data);
    if (result.success) return result.data;
    
    console.error('[API Validation Error]:', result.error);
    throw new Error('데이터 형식이 올바르지 않습니다.');
  }

  // 실패 시 메시지 처리
  const errorMsg = responseData?.msg || '알 수 없는 서버 오류가 발생했습니다.';
  throw new Error(errorMsg);
}

/**
 * --------------------------------------------------------------------------
 * PAY-01: 계좌 거래 내역 조회
 * --------------------------------------------------------------------------
 */
export async function fetchAccountHistoriesApi() {
  const response = await axiosClient.get(ENDPOINTS.payment.accountHistory);
  return validateAndUnwrap(response, z.array(accountHistorySchema));
}

/**
 * --------------------------------------------------------------------------
 * PAY-03: OCR 영수증 분석 (S3 URL 방식)
 * --------------------------------------------------------------------------
 * 프론트에서 S3 업로드 후 획득한 URL을 전달합니다.
 */
export async function fetchOcrAnalysisApi(imageUrl: string) {
  const response = await axiosClient.post(ENDPOINTS.payment.ocr, { imageUrl });
  return validateAndUnwrap(response, ocrDraftSchema);
}

/**
 * roomId가 문자열로 넘어오는 케이스를 숫자로 정규화해 API 경로를 안정적으로 맞춘다.
 */
function getEffectiveRoomId(roomId: number | string): number {
    const parsed = typeof roomId === 'string' ? Number(roomId) : roomId;
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('유효하지 않은 모임방 ID입니다.');
  }
  return parsed;
}

/**
 * --------------------------------------------------------------------------
 * PAY-04: 결제안 등록
 * --------------------------------------------------------------------------
 */
export async function createExpenseApi(roomId: number | string, request: ExpenseUpsertRequest) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.post(ENDPOINTS.payment.expenses(effectiveId), request);
  return validateAndUnwrap(response, z.number()); // 생성된 expenseId 반환
}

/**
 * --------------------------------------------------------------------------
 * PAY-05: 내가 생성한 결제안 목록 조회
 * --------------------------------------------------------------------------
 */
export async function fetchMyExpensesApi(roomId: number | string) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.get(ENDPOINTS.payment.myExpenses(effectiveId));
  return validateAndUnwrap(response, z.array(expenseSummarySchema));
}

/**
 * --------------------------------------------------------------------------
 * PAY-05: 결제안 상세 조회
 * --------------------------------------------------------------------------
 */
export async function fetchExpenseDetailApi(roomId: number | string, expenseId: number) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.get(ENDPOINTS.payment.expenseDetail(effectiveId, expenseId));
  return validateAndUnwrap(response, expenseDetailSchema);
}

/**
 * --------------------------------------------------------------------------
 * PAY-06: 결제안 삭제
 * --------------------------------------------------------------------------
 */
export async function deleteExpenseApi(roomId: number | string, expenseId: number) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.delete(ENDPOINTS.payment.expenseDetail(effectiveId, expenseId));
  return validateAndUnwrap(response, z.string()); // 성공 메시지 반환
}

/**
 * --------------------------------------------------------------------------
 * PAY-07: 결제안 수정
 * --------------------------------------------------------------------------
 */
export async function updateExpenseApi(
  roomId: number | string, 
  expenseId: number, 
  request: ExpenseUpsertRequest
) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.put(ENDPOINTS.payment.expenseDetail(effectiveId, expenseId), request);
  return validateAndUnwrap(response, z.string()); // 성공 메시지 반환
}

/**
 * --------------------------------------------------------------------------
 * 정산 참여 가능 멤버 조회
 * --------------------------------------------------------------------------
 */
export async function fetchExpenseParticipantsApi(roomId: number | string) {
  const effectiveId = getEffectiveRoomId(roomId);
  const response = await axiosClient.get(ENDPOINTS.payment.participants(effectiveId));
  return validateAndUnwrap(response, z.array(z.object({
    userId: z.number(),
    userName: z.string(),
    userTag: z.string().optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
  })));
}

/**
 * 에러 객체에서 사용자용 메시지를 추출하는 헬퍼
 */
export function getPaymentErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.msg || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
