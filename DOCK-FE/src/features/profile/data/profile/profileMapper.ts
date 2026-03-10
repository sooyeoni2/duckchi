import type {
  AccountDto,
  AcquiredBadgeDto,
  BadgeListDto,
  LockedBadgeDto,
  ProfileBadgeDto,
  ProfileDetailDto,
  ProfileSummaryDto,
} from './profileDto';
import type {
  AccountEntity,
  AcquiredBadgeEntity,
  BadgeListEntity,
  LockedBadgeEntity,
  ProfileBadgeEntity,
  ProfileEntity,
  ProfileSummaryEntity,
} from '../../domain/profile/ProfileEntity';

const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
};

const toAccountEntity = (dto: AccountDto): AccountEntity => ({
  accountId: dto.accountId,
  bankCode: dto.bankCode,
  bankName: dto.bankName,
  accountNumber: dto.accountNumber,
  registeredAt: parseDate(dto.registeredAt),
});

const toProfileBadgeEntity = (dto: ProfileBadgeDto): ProfileBadgeEntity => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  isAcquired: dto.isAcquired,
  acquiredAt: dto.isAcquired ? parseDate(dto.requiredAt) : null,
});

const toAcquiredBadgeEntity = (dto: AcquiredBadgeDto): AcquiredBadgeEntity => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  acquiredAt: parseDate(dto.acquiredAt),
  description: dto.description,
});

const toLockedBadgeEntity = (dto: LockedBadgeDto): LockedBadgeEntity => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  description: dto.description,
  requiredCount: dto.requiredCount,
  currentCount: dto.currentCount,
});

export const ProfileMapper = {
  toEntity: (dto: ProfileDetailDto): ProfileEntity => ({
    userId: dto.userId,
    email: dto.email,
    name: dto.name,
    tag: dto.tag,
    transferLimit: dto.transferLimit,
    createdAt: parseDate(dto.createdAt),
    accounts: dto.accounts.map(toAccountEntity),
    badges: dto.badges.map(toProfileBadgeEntity),
  }),

  toSummaryEntity: (dto: ProfileSummaryDto): ProfileSummaryEntity => ({
    userId: dto.userId,
    email: dto.email,
    name: dto.name,
    tag: dto.tag,
    transferLimit: dto.transferLimit,
    createdAt: parseDate(dto.createdAt),
  }),

  toBadgeListEntity: (dto: BadgeListDto): BadgeListEntity => ({
    acquiredBadges: dto.acquiredBadges.map(toAcquiredBadgeEntity),
    lockedBadges: dto.lockedBadges.map(toLockedBadgeEntity),
  }),
};
