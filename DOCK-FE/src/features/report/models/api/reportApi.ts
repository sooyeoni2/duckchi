import { ENDPOINTS } from '@core/constants/apiConstants';
import { axiosClient } from '@core/network/axiosClient';
import { z } from 'zod';
import {
  categorySpendResponseSchema,
  monthlySummaryResponseSchema,
  monthlyTrendResponseSchema,
  reportApiResponseSchema,
  roomSpendResponseSchema,
} from '../types/reportTypes';

/**
 * API 공통 응답 데이터 Unwrap & Validation 헬퍼
 */
async function validateAndUnwrap<T extends z.ZodTypeAny>(
  response: any,
  schema: T,
): Promise<z.infer<T>> {
  const responseData = response.data;
  
  if (responseData && responseData.success === true) {
    const result = schema.safeParse(responseData.data);
    if (result.success) return result.data;
    
    console.error('[Insight API Validation Error]:', result.error);
    throw new Error('데이터 형식이 올바르지 않습니다.');
  }

  const errorMsg = responseData?.msg || '알 수 없는 서버 오류가 발생했습니다.';
  throw new Error(errorMsg);
}

/**
 * --------------------------------------------------------------------------
 * AN-01: 월간 카테고리별 지출 통계 조회
 * --------------------------------------------------------------------------
 * @param month YYYY-MM 형식의 조회 대상 월
 */
export async function fetchCategoryStatisticsApi(month: string) {
  const response = await axiosClient.get(ENDPOINTS.insight.monthlyCategories, {
    params: { month },
  });
  return validateAndUnwrap(response, z.array(categorySpendResponseSchema));
}

/**
 * --------------------------------------------------------------------------
 * AN-02: 월간 지출 요약 조회 (전월 대비)
 * --------------------------------------------------------------------------
 * @param month YYYY-MM 형식의 조회 대상 월
 */
export async function fetchMonthlySummaryApi(month: string) {
  const response = await axiosClient.get(ENDPOINTS.insight.monthlySummary, {
    params: { month },
  });
  return validateAndUnwrap(response, monthlySummaryResponseSchema);
}

/**
 * --------------------------------------------------------------------------
 * AN-03: 월간 모임방 지출 랭킹 조회
 * --------------------------------------------------------------------------
 * @param month YYYY-MM 형식의 조회 대상 월
 */
export async function fetchRoomRankingApi(month: string) {
  const response = await axiosClient.get(ENDPOINTS.insight.monthlyRoomsRanking, {
    params: { month },
  });
  return validateAndUnwrap(response, z.array(roomSpendResponseSchema));
}

/**
 * --------------------------------------------------------------------------
 * AN-04: 소비 트렌드 조회 (최근 6개월)
 * --------------------------------------------------------------------------
 */
export async function fetchTrendsApi() {
  const response = await axiosClient.get(ENDPOINTS.insight.trends);
  return validateAndUnwrap(response, z.array(monthlyTrendResponseSchema));
}
