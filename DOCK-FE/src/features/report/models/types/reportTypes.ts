import { z } from 'zod';

/**
 * --------------------------------------------------------------------------
 * 1. API 공통 응답 스키마 (Zod) - 백엔드 공통 예외/래퍼 기준
 * --------------------------------------------------------------------------
 */
export const reportApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    msg: z.string().optional().nullable(),
    errorCode: z.string().optional().nullable(),
  });

/**
 * --------------------------------------------------------------------------
 * 2. AN-01: 월간 카테고리별 지출 통계 DTO (CategorySpendResponse)
 * --------------------------------------------------------------------------
 */
export const categorySpendResponseSchema = z.object({
  category: z.string(),
  amount: z.number(),
  percentage: z.number(),
});

export type CategorySpendResponse = z.infer<typeof categorySpendResponseSchema>;

/**
 * --------------------------------------------------------------------------
 * 3. AN-02: 월간 지출 요약 응답 DTO (MonthlySummaryResponse)
 * --------------------------------------------------------------------------
 */
export const monthlySummaryResponseSchema = z.object({
  targetMonth: z.string(),
  totalAmount: z.number(),
  previousMonthAmount: z.number(),
  difference: z.number(),
});

export type MonthlySummaryResponse = z.infer<typeof monthlySummaryResponseSchema>;

/**
 * --------------------------------------------------------------------------
 * 4. AN-03: 방별 지출 통계 응답 DTO (RoomSpendResponse)
 * --------------------------------------------------------------------------
 */
export const roomSpendResponseSchema = z.object({
  roomId: z.number(),
  roomName: z.string(),
  amount: z.number(),
});

export type RoomSpendResponse = z.infer<typeof roomSpendResponseSchema>;

/**
 * --------------------------------------------------------------------------
 * 5. AN-04: 월별 소비 트렌드 항목 DTO (MonthlyTrendResponse)
 * --------------------------------------------------------------------------
 */
export const monthlyTrendResponseSchema = z.object({
  month: z.string(),
  totalAmount: z.number(),
});

export type MonthlyTrendResponse = z.infer<typeof monthlyTrendResponseSchema>;
