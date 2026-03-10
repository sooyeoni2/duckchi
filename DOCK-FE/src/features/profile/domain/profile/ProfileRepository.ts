import type { BadgeListEntity, ProfileEntity, ProfileSummaryEntity } from './ProfileEntity';

export interface ProfileEditParams {
  transferLimit?: number;
  profileImageKey?: string;
}

export interface ProfileRepository {
  fetchProfileDetail(): Promise<ProfileEntity>;
  patchProfile(params: ProfileEditParams): Promise<ProfileSummaryEntity>;
  fetchBadges(): Promise<BadgeListEntity>;
}
