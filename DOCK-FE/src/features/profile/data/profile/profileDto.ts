import { z } from 'zod';

const accountDtoSchema = z.object({
  accountId: z.number(),
  bankCode: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  registeredAt: z.string(),
});

const profileBadgeDtoSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  isAcquired: z.boolean(),
  requiredAt: z.string(),
});

export const profileDetailDtoSchema = z.object({
  userId: z.number(),
  email: z.string(),
  name: z.string(),
  tag: z.string(),
  transferLimit: z.number(),
  createdAt: z.string(),
  profileImageUrl: z.string().nullable(),
  accounts: z.array(accountDtoSchema),
  badges: z.array(profileBadgeDtoSchema),
});

export const profileEditRequestSchema = z.object({
  transferLimit: z.number().optional(),
  profileImageKey: z.string().optional(),
});

export const profileSummaryDtoSchema = z.object({
  userId: z.number(),
  email: z.string(),
  name: z.string(),
  tag: z.string(),
  profileImageUrl: z.string().nullable(),
  transferLimit: z.number(),
  createdAt: z.string(),
});

const acquiredBadgeDtoSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  acquiredAt: z.string(),
  description: z.string(),
});

const lockedBadgeDtoSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  requiredCount: z.number(),
  currentCount: z.number(),
});

export const badgeListDtoSchema = z.object({
  acquiredBadges: z.array(acquiredBadgeDtoSchema),
  lockedBadges: z.array(lockedBadgeDtoSchema),
});

export type ProfileDetailDto = z.infer<typeof profileDetailDtoSchema>;
export type AccountDto = z.infer<typeof accountDtoSchema>;
export type ProfileBadgeDto = z.infer<typeof profileBadgeDtoSchema>;
export type ProfileEditRequest = z.infer<typeof profileEditRequestSchema>;
export type ProfileSummaryDto = z.infer<typeof profileSummaryDtoSchema>;
export type AcquiredBadgeDto = z.infer<typeof acquiredBadgeDtoSchema>;
export type LockedBadgeDto = z.infer<typeof lockedBadgeDtoSchema>;
export type BadgeListDto = z.infer<typeof badgeListDtoSchema>;
