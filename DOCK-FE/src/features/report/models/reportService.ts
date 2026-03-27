import { ENDPOINTS } from '@core/constants/apiConstants';
import { axiosClient } from '@core/network/axiosClient';

import type {
  ReportAmountRankingItem,
  ReportCategoryData,
  ReportFrequencyRankingItem,
  ReportMonthData,
  ReportMonthOption,
} from './reportTypes';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  msg?: string;
  errorCode?: string;
}

interface TrendDto {
  month: string;
  totalAmount: number;
}

interface CategoryDto {
  category: string;
  amount: number;
  percentage?: number;
  ratio?: number;
  count?: number;
}

interface SummaryDto {
  targetMonth?: string;
  totalAmount?: number;
  previousMonthAmount?: number;
  difference?: number;
  rate?: {
    month?: string;
    amount?: number;
    prevAmount?: number;
  };
}

interface RoomAmountRankingDto {
  roomId?: number | string;
  roomName?: string;
  amount?: number;
  totalAmount?: number;
}

const DONUT_COLORS = ['#F2DD65', '#F59A36', '#5EA64E', '#69A6F9', '#C08CF5', '#8CCB6E'];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  회식: '#F2DD65',
  여행: '#F59A36',
  데이트: '#5EA64E',
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const unwrapOrThrow = <T>(response: ApiEnvelope<T>, fallbackMessage: string): T => {
  if (response.success !== true) {
    throw new Error(response.msg ?? fallbackMessage);
  }
  return response.data;
};

const normalizeMonth = (month: string): string => {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthValue = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(monthValue)) {
    return month;
  }
  return `${year}-${String(monthValue).padStart(2, '0')}`;
};

const buildMonthOption = (monthValue: string): ReportMonthOption => {
  const normalized = normalizeMonth(monthValue);
  const [yearText, monthText] = normalized.split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  return {
    value: normalized,
    year,
    month,
    label: `${year}년 ${month}월`,
  };
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (month: string, offset: number): string => {
  const [yearText, monthText] = normalizeMonth(month).split('-');
  const year = Number(yearText);
  const monthValue = Number(monthText);
  const base = new Date(year, monthValue - 1, 1);
  base.setMonth(base.getMonth() + offset);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
};

const parseTrendItems = (raw: unknown): TrendDto[] => {
  if (Array.isArray(raw)) {
    return raw as TrendDto[];
  }
  // 왜: 서버/문서 버전마다 data 래핑 구조가 달라서 monthHistory 래퍼도 함께 허용한다.
  if (raw != null && typeof raw === 'object' && Array.isArray((raw as any).monthHistory)) {
    return (raw as any).monthHistory as TrendDto[];
  }
  return [];
};

const resolveCategoryColor = (category: string, index: number): string =>
  CATEGORY_COLOR_MAP[category] ?? DONUT_COLORS[index % DONUT_COLORS.length];

const parseCategoryItems = (raw: unknown): CategoryDto[] => {
  if (Array.isArray(raw)) {
    return raw as CategoryDto[];
  }
  // 왜: 구버전 스펙은 categoryRatios 객체 래퍼를 사용하므로 배열/객체 두 형태를 모두 안전 파싱한다.
  if (
    raw != null &&
    typeof raw === 'object' &&
    Array.isArray((raw as any).categoryRatios)
  ) {
    return (raw as any).categoryRatios as CategoryDto[];
  }
  return [];
};

const parseRoomRanking = (raw: unknown): RoomAmountRankingDto[] => {
  if (Array.isArray(raw)) {
    return raw as RoomAmountRankingDto[];
  }
  // 신구 스펙이아니라 없는 필드를 평범하게 처리
  if (raw != null && typeof raw === 'object' && 'expenseRank' in raw) {
    const expenseRank = (raw as Record<string, unknown>)['expenseRank'];
    return Array.isArray(expenseRank) ? (expenseRank as RoomAmountRankingDto[]) : [];
  }
  return [];
};

const mapCategories = (items: CategoryDto[]): ReportCategoryData[] => {
  const sorted = [...items].sort((a, b) => toNumber(b.amount) - toNumber(a.amount));
  const sum = sorted.reduce((total, item) => total + toNumber(item.amount), 0);

  return sorted.map((item, index) => {
    const percentageValue = item.percentage ?? item.ratio;
    const normalizedPercentage =
      percentageValue == null
        ? sum <= 0
          ? 0
          : Math.round((toNumber(item.amount) / sum) * 100)
        : percentageValue <= 1
          ? Math.round(percentageValue * 100)
          : Math.round(percentageValue);

    return {
      name: item.category ?? '기타',
      amount: toNumber(item.amount),
      count: toNumber(item.count),
      percentage: normalizedPercentage,
      color: resolveCategoryColor(item.category ?? '기타', index),
    };
  });
};

const mapAmountRanking = (items: RoomAmountRankingDto[]): ReportAmountRankingItem[] =>
  items
    .map((item) => ({
      roomId:
        item.roomId == null
          ? null
          : Number.isFinite(Number(item.roomId))
            ? Number(item.roomId)
            : null,
      roomName: item.roomName ?? '알 수 없는 모임',
      amount: toNumber(item.amount ?? item.totalAmount),
    }))
    .sort((a, b) => b.amount - a.amount);

const mapFrequencyRanking = (items: Array<{ roomId: number; roomName: string; count: number }>): ReportFrequencyRankingItem[] =>
  items
    .map((item) => ({
      roomName: item.roomName ?? '알 수 없는 모임',
      count: item.count,
      tag: '',
    }))
    .sort((a, b) => b.count - a.count);

const fetchMonthlySummary = async (month: string): Promise<{
  totalAmount: number;
  difference: number;
}> => {
  const response = await axiosClient.get<ApiEnvelope<SummaryDto | Record<string, unknown>>>(
    ENDPOINTS.insight.monthlySummary,
    { params: { month } },
  );

  const data = unwrapOrThrow(response.data, '월 소비 요약을 불러오지 못했습니다.');
  const summary = data as SummaryDto;

  const totalAmount = toNumber(summary.totalAmount ?? summary.rate?.amount);
  const difference = toNumber(
    summary.difference ??
      (summary.rate?.amount ?? 0) - (summary.rate?.prevAmount ?? 0),
  );

  return { totalAmount, difference };
};

const fetchMonthlyCategories = async (month: string): Promise<ReportCategoryData[]> => {
  const response = await axiosClient.get<ApiEnvelope<unknown>>(
    ENDPOINTS.insight.monthlyCategories,
    { params: { month } },
  );
  const data = unwrapOrThrow(response.data, '월 카테고리 통계를 불러오지 못했습니다.');
  return mapCategories(parseCategoryItems(data));
};

const fetchMonthlyRoomRankings = async (
  month: string,
): Promise<{
  amountRanking: ReportAmountRankingItem[];
  frequencyRanking: ReportFrequencyRankingItem[];
}> => {
  const [amountResponse, frequencyResponse] = await Promise.all([
    axiosClient.get<ApiEnvelope<unknown>>(ENDPOINTS.insight.monthlyRoomsRanking, { params: { month } }),
    axiosClient.get<ApiEnvelope<Array<{ roomId: number; roomName: string; count: number }>>>(
      ENDPOINTS.insight.monthlyRoomsFrequency,
      { params: { month } },
    ),
  ]);

  const amountData = unwrapOrThrow(amountResponse.data, '모임 지출 랭킹을 불러오지 못했습니다.');
  const frequencyData = unwrapOrThrow(frequencyResponse.data, '모임 빈도 랭킹을 불러오지 못했습니다.');

  const parsed = parseRoomRanking(amountData);
  return {
    amountRanking: mapAmountRanking(parsed),
    frequencyRanking: mapFrequencyRanking(Array.isArray(frequencyData) ? frequencyData : []),
  };
};

export const fetchReportMonthOptions = async (): Promise<ReportMonthOption[]> => {
  const response = await axiosClient.get<ApiEnvelope<unknown>>(ENDPOINTS.insight.trends);
  const data = unwrapOrThrow(response.data, '월별 소비 추이를 불러오지 못했습니다.');
  const trendItems = parseTrendItems(data);

  const monthValues = trendItems
    .filter((item) => toNumber(item.totalAmount) > 0)
    .map((item) => normalizeMonth(item.month));

  const uniqueSorted = [...new Set(monthValues)].sort((a, b) => a.localeCompare(b));

  // 왜: 서버 응답에 유효 월이 하나도 없으면 화면 이동이 막히므로 현재월 1개를 기본값으로 보장한다.
  const safeMonths = uniqueSorted.length > 0 ? uniqueSorted : [getCurrentMonth()];
  return safeMonths.map(buildMonthOption);
};

export const fetchReportMonthData = async (
  monthOption: ReportMonthOption,
): Promise<ReportMonthData> => {
  const month = monthOption.value;

  const [summary, categories, rankings] = await Promise.all([
    fetchMonthlySummary(month),
    fetchMonthlyCategories(month),
    fetchMonthlyRoomRankings(month),
  ]);

  const topCategory = categories[0];
  let topCategoryDiff = 0;

  if (topCategory != null) {
    try {
      const previousMonth = shiftMonth(month, -1);
      const previousCategories = await fetchMonthlyCategories(previousMonth);
      const previousTopCategory = previousCategories.find(
        (item) => item.name === topCategory.name,
      );
      topCategoryDiff = topCategory.amount - (previousTopCategory?.amount ?? 0);
    } catch {
      topCategoryDiff = 0;
    }
  }

  return {
    month: monthOption,
    totalSpend: summary.totalAmount,
    monthlyDiff: summary.difference,
    categories,
    topCategoryName: topCategory?.name ?? '-',
    topCategoryDiff,
    amountRanking: rankings.amountRanking,
    frequencyRanking: rankings.frequencyRanking,
  };
};
