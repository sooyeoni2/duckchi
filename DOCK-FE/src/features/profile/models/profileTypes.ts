export interface Account {
  accountId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  registeredAt: Date;
}

export interface ProfileBadge {
  id: number;
  code: string;
  name: string;
  isAcquired: boolean;
  acquiredAt: Date | null;
  imageUrl: string | null;
}

export interface Profile {
  userId: number;
  email: string;
  name: string;
  tag: string;
  transferLimit: number;
  createdAt: Date;
  profileImageUrl: string | null;
  notificationEnabled: boolean;
  accounts: Account[];
  badges: ProfileBadge[];
}

export interface ProfileSummary {
  userId: number;
  email: string;
  name: string;
  tag: string;
  profileImageUrl: string | null;
  transferLimit: number;
  createdAt: Date;
}

export interface AcquiredBadge {
  id: number;
  code: string;
  name: string;
  acquiredAt: Date;
  description: string;
  imageUrl: string | null;
}

export interface LockedBadge {
  id: number;
  code: string;
  name: string;
  description: string;
  requiredCount: number;
  currentCount: number;
  imageUrl: string | null;
}

export interface BadgeList {
  acquiredBadges: AcquiredBadge[];
  lockedBadges: LockedBadge[];
}

export interface UpdateProfileParams {
  transferLimit?: number;
  profileImageKey?: string;
}

