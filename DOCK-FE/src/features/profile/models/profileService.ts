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
  imageUrl: z.string().nullable().optional(),
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
  imageUrl: z.string().nullable().optional(),
});

const lockedBadgeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  requiredCount: z.number(),
  currentCount: z.number(),
  imageUrl: z.string().nullable().optional(),
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
  imageUrl: raw.imageUrl ?? null,
});

const toAcquiredBadge = (raw: z.infer<typeof acquiredBadgeSchema>): AcquiredBadge => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  acquiredAt: toDate(raw.acquiredAt),
  description: raw.description,
  imageUrl: raw.imageUrl ?? null,
});

const toLockedBadge = (raw: z.infer<typeof lockedBadgeSchema>): LockedBadge => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  description: raw.description,
  requiredCount: raw.requiredCount,
  currentCount: raw.currentCount,
  imageUrl: raw.imageUrl ?? null,
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
    { id: 1, code: 'NOBLE_DUCK', name: '귀족 덕치', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 2, code: 'ASSASSIN_DUCK', name: '칼입금 암살자', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 3, code: 'TURTLE_DUCK', name: '거북이덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 4, code: 'INSSA_DUCK', name: '인싸덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 5, code: 'SCANNER_DUCK', name: '스캐너덕', isAcquired: true, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 6, code: 'INVITE_MASTER', name: '초대 마스터', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 7, code: 'ALLEY_BOSS', name: '골목 대장덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 8, code: 'ALLROUNDER_DUCK', name: '팔방미인덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 9, code: 'MANSOUR_DUCK', name: '만수르덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
    { id: 10, code: 'NIGHTOWL_DUCK', name: '올빼미덕', isAcquired: false, requiredAt: '2026-03-04T15:30:00+09:00' },
  ],
});

const mockBadgeList = badgeListSchema.parse({
  acquiredBadges: [
    { id: 5, code: 'SCANNER_DUCK', name: '스캐너덕', description: '영수증 인식 10회', acquiredAt: '2026-03-04T15:30:00+09:00' },
  ],
  lockedBadges: [
    { id: 1, code: 'NOBLE_DUCK', name: '귀족 덕치', description: '누적 결제 금액 달성', requiredCount: 1000000, currentCount: 0 },
    { id: 2, code: 'ASSASSIN_DUCK', name: '칼입금 암살자', description: '정산 요청 1시간 이내 입금 10회', requiredCount: 10, currentCount: 0 },
    { id: 3, code: 'TURTLE_DUCK', name: '거북이덕', description: '48시간 이상 지연 송금 3회', requiredCount: 3, currentCount: 0 },
    { id: 4, code: 'INSSA_DUCK', name: '인싸덕', description: '모임방 참여 10회', requiredCount: 10, currentCount: 6 },
    { id: 6, code: 'INVITE_MASTER', name: '초대 마스터', description: '초대 링크로 누적 10명 입장', requiredCount: 10, currentCount: 0 },
    { id: 7, code: 'ALLEY_BOSS', name: '골목 대장덕', description: '모임방 방장 10회', requiredCount: 10, currentCount: 0 },
    { id: 8, code: 'ALLROUNDER_DUCK', name: '팔방미인덕', description: '모든 모임 카테고리 참여', requiredCount: 5, currentCount: 0 },
    { id: 9, code: 'MANSOUR_DUCK', name: '만수르덕', description: '계좌 3개 이상 등록', requiredCount: 3, currentCount: 0 },
    { id: 10, code: 'NIGHTOWL_DUCK', name: '올빼미덕', description: '자정~새벽 5시 송금 5회', requiredCount: 5, currentCount: 0 },
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

export const deleteAccount = async (accountId: number): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    mockProfile = {
      ...mockProfile,
      accounts: mockProfile.accounts.filter(a => a.accountId !== accountId),
    };
    return;
  }
  await axiosClient.post(`/api/v1/auth/bank-accounts/${accountId}/delete`);
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
