export interface ReportMonthOption {
  value: string;
  year: number;
  month: number;
  label: string;
}

export interface ReportCategoryData {
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  monthlyDiff?: number;
}

export interface ReportAmountRankingItem {
  roomId: number | null;
  roomName: string;
  amount: number;
}

export interface ReportFrequencyRankingItem {
  roomName: string;
  count: number;
  tag: string;
}

export interface ReportMonthData {
  month: ReportMonthOption;
  totalSpend: number;
  monthlyDiff: number;
  categories: ReportCategoryData[];
  topCategoryName: string;
  topCategoryDiff: number;
  amountRanking: ReportAmountRankingItem[];
  frequencyRanking: ReportFrequencyRankingItem[];
}

export type ReportViewState =
  | { status: 'loading'; monthOptions: ReportMonthOption[]; selectedMonth: string | null }
  | {
      status: 'loaded';
      monthOptions: ReportMonthOption[];
      selectedMonth: string;
      data: ReportMonthData;
    }
  | {
      status: 'error';
      monthOptions: ReportMonthOption[];
      selectedMonth: string | null;
      message: string;
    };
