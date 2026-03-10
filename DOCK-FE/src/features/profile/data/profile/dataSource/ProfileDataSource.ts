import type { BadgeListDto, ProfileDetailDto, ProfileSummaryDto } from '../profileDto';

export interface ProfileDataSource {
  fetchProfileDetail(): Promise<ProfileDetailDto>;
  patchProfile(transferLimit: number): Promise<ProfileSummaryDto>;
  fetchBadges(): Promise<BadgeListDto>;
}
