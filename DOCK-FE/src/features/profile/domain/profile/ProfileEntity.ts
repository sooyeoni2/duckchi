export interface AccountEntity {
  accountId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  registeredAt: Date;
}

export interface ProfileBadgeEntity {
  id: number;
  code: string;
  name: string;
  isAcquired: boolean;
  acquiredAt: Date | null;
}

export interface ProfileEntity {
  userId: number;
  email: string;
  name: string;
  tag: string;
  transferLimit: number;
  createdAt: Date;
  accounts: AccountEntity[];
  badges: ProfileBadgeEntity[];
}

export interface ProfileSummaryEntity {
  userId: number;
  email: string;
  name: string;
  tag: string;
  transferLimit: number;
  createdAt: Date;
}

export interface AcquiredBadgeEntity {
  id: number;
  code: string;
  name: string;
  acquiredAt: Date;
  description: string;
}

export interface LockedBadgeEntity {
  id: number;
  code: string;
  name: string;
  description: string;
  requiredCount: number;
  currentCount: number;
}

export interface BadgeListEntity {
  acquiredBadges: AcquiredBadgeEntity[];
  lockedBadges: LockedBadgeEntity[];
}
