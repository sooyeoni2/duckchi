import { ENDPOINTS } from '../../../core/constants/apiConstants';
import { axiosClient } from '../../../core/network/axiosClient';
import { HOME_DASHBOARD_MOCK } from './homeMockData';
import type {
  HomeDashboardData,
  HomeProfile,
  MonthlyTrendPoint,
  PendingSettlementCardItem,
} from './homeTypes';

const USE_MOCK = false;
const DEADLINE_HOURS = 48;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  msg?: string;
  errorCode?: string;
}

interface ProfileDetailDto {
  name: string;
  tag: string;
  profileImageUrl?: string | null;
}

interface RoomListDto {
  roomId: number;
  roomName: string;
  isProgress: boolean;
}

interface RoomMySetItemDto {
  settlementId: number;
  expenseId: number;
  title: string;
  requesterUserName: string;
  setUserCount: number;
  payableAmount: number;
  isCompleted: boolean;
  requestedAt: string;
}

interface RoomMySetDto {
  mySet: RoomMySetItemDto[];
}

interface TrendDto {
  month: string;
  totalAmount: number;
}

interface AutoDebitConsentDto {
  roomId: number;
  userId: number;
  role: 'ADMIN' | 'MEMBER';
  isAgreed: boolean;
  agreedCount?: number;
  participantCount?: number;
  consentRate?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const unwrapOrThrow = <T>(response: ApiEnvelope<T>, fallbackMessage: string): T => {
  if (response.success !== true) {
    throw new Error(response.msg ?? fallbackMessage);
  }
  return response.data;
};

const toPendingCard = (
  roomId: number,
  roomName: string,
  item: RoomMySetItemDto,
): PendingSettlementCardItem => {
  const dueAtMs =
    new Date(item.requestedAt).getTime() + DEADLINE_HOURS * 60 * 60 * 1000;
  const remainingHours = Math.ceil((dueAtMs - Date.now()) / (60 * 60 * 1000));
  const elapsedHours = DEADLINE_HOURS - remainingHours;
  const progressRatio = clamp(elapsedHours / DEADLINE_HOURS, 0, 1);

  return {
    roomId,
    settlementId: item.settlementId,
    expenseId: item.expenseId,
    roomName,
    title: item.title,
    requesterName: item.requesterUserName,
    amount: item.payableAmount,
    remainingHours,
    progressRatio,
  };
};

const fetchHomeProfile = async (): Promise<HomeProfile> => {
  if (USE_MOCK) {
    return HOME_DASHBOARD_MOCK.profile;
  }

  const response = await axiosClient.get<ApiEnvelope<ProfileDetailDto>>(
    '/api/v1/profiles/detail',
  );
  const data = unwrapOrThrow(response.data, '프로필 정보를 불러오지 못했습니다.');
  return {
    name: data.name,
    tag: data.tag,
    profileImageUrl: data.profileImageUrl ?? null,
  };
};

const fetchPendingSettlements = async (): Promise<PendingSettlementCardItem[]> => {
  if (USE_MOCK) {
    return HOME_DASHBOARD_MOCK.pendingSettlements;
  }

  const roomListResponse = await axiosClient.get<ApiEnvelope<RoomListDto[]>>(
    ENDPOINTS.room.roomLists,
    { params: { isProgress: true } },
  );
  const rooms = unwrapOrThrow(
    roomListResponse.data,
    '모임 목록을 불러오지 못했습니다.',
  );

  const mySetResults = await Promise.all(
    rooms.map(async (room) => {
      const mySetResponse = await axiosClient.get<ApiEnvelope<RoomMySetDto>>(
        ENDPOINTS.room.mySet(room.roomId),
      );
      const mySetData = unwrapOrThrow(
        mySetResponse.data,
        '정산 대기 정보를 불러오지 못했습니다.',
      );
      return (mySetData.mySet ?? [])
        .filter((item) => item.isCompleted !== true)
        .map((item) => toPendingCard(room.roomId, room.roomName, item));
    }),
  );

  return mySetResults.flat().sort((a, b) => a.remainingHours - b.remainingHours);
};

const fetchMonthlyTrends = async (): Promise<MonthlyTrendPoint[]> => {
  if (USE_MOCK) {
    return HOME_DASHBOARD_MOCK.monthlyTrends;
  }

  const response = await axiosClient.get<ApiEnvelope<TrendDto[]>>(
    ENDPOINTS.insight.trends,
  );
  const trends = unwrapOrThrow(response.data, '월별 지출 추이를 불러오지 못했습니다.');
  return trends.sort((a, b) => a.month.localeCompare(b.month));
};

type SectionResult<T> = { value: T; isFallback: boolean };

const withFallback = async <T>(
  task: () => Promise<T>,
  fallbackValue: T,
): Promise<SectionResult<T>> => {
  try {
    return { value: await task(), isFallback: false };
  } catch {
    return { value: fallbackValue, isFallback: true };
  }
};

export const fetchHomeDashboard = async (): Promise<{
  data: HomeDashboardData;
  fallbackSections: string[];
}> => {
  const [profileResult, pendingResult, trendResult] = await Promise.all([
    withFallback(fetchHomeProfile, HOME_DASHBOARD_MOCK.profile),
    withFallback(fetchPendingSettlements, HOME_DASHBOARD_MOCK.pendingSettlements),
    withFallback(fetchMonthlyTrends, HOME_DASHBOARD_MOCK.monthlyTrends),
  ]);

  const fallbackSections: string[] = [];
  if (profileResult.isFallback) fallbackSections.push('profile');
  if (pendingResult.isFallback) fallbackSections.push('pending');
  if (trendResult.isFallback) fallbackSections.push('trends');

  return {
    data: {
      profile: profileResult.value,
      pendingSettlements: pendingResult.value,
      monthlyTrends: trendResult.value,
    },
    fallbackSections,
  };
};

export const fetchRoomAutoDebitConsent = async (roomId: number): Promise<boolean> => {
  if (USE_MOCK) {
    return true;
  }

  const response = await axiosClient.get<ApiEnvelope<AutoDebitConsentDto>>(
    ENDPOINTS.room.autoDebitConsents(roomId),
  );
  const data = unwrapOrThrow(
    response.data,
    '자동이체 동의 상태를 불러오지 못했습니다.',
  );
  return data.isAgreed === true;
};

export const areAllRoomsAutoDebitAgreed = async (roomIds: number[]): Promise<boolean> => {
  const uniqueRoomIds = [...new Set(roomIds)];
  if (uniqueRoomIds.length === 0) {
    return false;
  }

  const results = await Promise.allSettled(
    uniqueRoomIds.map((roomId) => fetchRoomAutoDebitConsent(roomId)),
  );

  return results.every(
    (result) => result.status === 'fulfilled' && result.value === true,
  );
};

export const transferPendingSettlements = async (settlementIds: number[]): Promise<void> => {
  if (settlementIds.length === 0) {
    return;
  }

  await axiosClient.post('/api/v1/settlements/transfer', { settlementIds });
};
