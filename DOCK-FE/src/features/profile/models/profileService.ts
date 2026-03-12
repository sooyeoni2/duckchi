import { z } from 'zod';

import { axiosClient } from '../../../core/network/axiosClient';
import type {
  Account,
  AcquiredBadge,
  BadgeList,
  LockedBadge,
  Profile,
  ProfileBadge,
  ProfileSummary,
  UpdateProfileParams,
} from './profileTypes';

// ─────────────────────────────────────────
// Zod 스키마 (API 응답 검증용)
// ─────────────────────────────────────────

const accountSchema = z.object({
  accountId: z.number(),
  bankCode: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  registeredAt: z.string(),
});

const profileBadgeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  isAcquired: z.boolean(),
  requiredAt: z.string(),
});

const profileDetailSchema = z.object({
  userId: z.number(),
  email: z.string(),
  name: z.string(),
  tag: z.string(),
  transferLimit: z.number(),
  createdAt: z.string(),
  profileImageUrl: z.string().nullable(),
  accounts: z.array(accountSchema),
  badges: z.array(profileBadgeSchema),
});

const profileSummarySchema = z.object({
  userId: z.number(),
  email: z.string(),
  name: z.string(),
  tag: z.string(),
  profileImageUrl: z.string().nullable(),
  transferLimit: z.number(),
  createdAt: z.string(),
});

const acquiredBadgeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  acquiredAt: z.string(),
  description: z.string(),
});

const lockedBadgeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  requiredCount: z.number(),
  currentCount: z.number(),
});

const badgeListSchema = z.object({
  acquiredBadges: z.array(acquiredBadgeSchema),
  lockedBadges: z.array(lockedBadgeSchema),
});

// ─────────────────────────────────────────
// 내부 변환 함수
// ─────────────────────────────────────────

const toDate = (s: string): Date => new Date(s);

const toAccount = (raw: z.infer<typeof accountSchema>): Account => ({
  accountId: raw.accountId,
  bankCode: raw.bankCode,
  bankName: raw.bankName,
  accountNumber: raw.accountNumber,
  registeredAt: toDate(raw.registeredAt),
});

const toProfileBadge = (raw: z.infer<typeof profileBadgeSchema>): ProfileBadge => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  isAcquired: raw.isAcquired,
  acquiredAt: raw.isAcquired ? toDate(raw.requiredAt) : null,
});

const toAcquiredBadge = (raw: z.infer<typeof acquiredBadgeSchema>): AcquiredBadge => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  acquiredAt: toDate(raw.acquiredAt),
  description: raw.description,
});

const toLockedBadge = (raw: z.infer<typeof lockedBadgeSchema>): LockedBadge => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  description: raw.description,
  requiredCount: raw.requiredCount,
  currentCount: raw.currentCount,
});

// ─────────────────────────────────────────
// Mock 데이터
// ─────────────────────────────────────────

const USE_MOCK = true;

let mockProfile = profileDetailSchema.parse({
  userId: 1,
  email: 'test@ssafy.co.kr',
  name: '김싸피',
  tag: '#123',
  transferLimit: 30000,
  createdAt: '2026-03-04T12:41:30+09:00',
  profileImageUrl: 'https://api.dicebear.com/9.x/lorelei/png?seed=duckduck&size=150',
  accounts: [
    {
      accountId: 10,
      bankCode: '088',
      bankName: '신한은행',
      accountNumber: '1234************',
      registeredAt: '2026-03-04T15:30:00+09:00',
    },
  ],
  badges: [
    { id: 2, code: 'FAST_SETTLER', name: '⚡ 번개 정산러', isAcquired: true, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 3, code: 'INSSA', name: '⚡ 프로 참여러', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
  ],
});

const mockBadgeList = badgeListSchema.parse({
  acquiredBadges: [
    { id: 2, code: 'FAST_SETTLER', name: '⚡ 번개 정산러', acquiredAt: '2026-03-04T15:30:00+09:00', description: '24h이내 10회' },
    { id: 3, code: 'INSSA', name: '⚡ 프로 참여러', acquiredAt: '2026-03-04T15:30:00+09:00', description: '모임 참여 10회 이상' },
  ],
  lockedBadges: [
    { id: 4, code: 'EARLY_BIRD', name: '🌅 얼리버드', description: '오전 7시 이전 정산 3회', requiredCount: 3, currentCount: 1 },
  ],
});

// ─────────────────────────────────────────
// Service 함수
// ─────────────────────────────────────────

export const fetchProfile = async (): Promise<Profile> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return {
      ...mockProfile,
      createdAt: toDate(mockProfile.createdAt),
      accounts: mockProfile.accounts.map(toAccount),
      badges: mockProfile.badges.map(toProfileBadge),
    };
  }
  const response = await axiosClient.get('/api/v1/profiles/detail');
  const raw = profileDetailSchema.parse(response.data.data);
  return {
    ...raw,
    createdAt: toDate(raw.createdAt),
    accounts: raw.accounts.map(toAccount),
    badges: raw.badges.map(toProfileBadge),
  };
};

export const updateProfile = async (params: UpdateProfileParams): Promise<ProfileSummary> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    if (params.transferLimit !== undefined) {
      mockProfile = { ...mockProfile, transferLimit: params.transferLimit };
    }
    const { accounts: _a, badges: _b, ...summary } = mockProfile;
    return { ...summary, createdAt: toDate(summary.createdAt) };
  }
  const response = await axiosClient.post('/api/v1/profiles/edit', params);
  const raw = profileSummarySchema.parse(response.data.data);
  return { ...raw, createdAt: toDate(raw.createdAt) };
};

export const fetchBadges = async (): Promise<BadgeList> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return {
      acquiredBadges: mockBadgeList.acquiredBadges.map(toAcquiredBadge),
      lockedBadges: mockBadgeList.lockedBadges.map(toLockedBadge),
    };
  }
  const response = await axiosClient.get('/api/v1/profiles/badges');
  const raw = badgeListSchema.parse(response.data.data);
  return {
    acquiredBadges: raw.acquiredBadges.map(toAcquiredBadge),
    lockedBadges: raw.lockedBadges.map(toLockedBadge),
  };
};
