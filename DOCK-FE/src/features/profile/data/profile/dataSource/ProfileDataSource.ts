import type { BadgeListDto, ProfileDetailDto, ProfileEditRequest, ProfileSummaryDto } from '../profileDto';

export interface ProfileDataSource {
  fetchProfileDetail(): Promise<ProfileDetailDto>;
  patchProfile(request: ProfileEditRequest): Promise<ProfileSummaryDto>;
  fetchBadges(): Promise<BadgeListDto>;
}
