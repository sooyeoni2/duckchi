import { axiosClient } from '../../../../../core/network/axiosClient';
import {
  badgeListDtoSchema,
  profileDetailDtoSchema,
  profileSummaryDtoSchema,
  type BadgeListDto,
  type ProfileDetailDto,
  type ProfileEditRequest,
  type ProfileSummaryDto,
} from '../profileDto';
import type { ProfileDataSource } from './ProfileDataSource';

export class ProfileDataSourceImpl implements ProfileDataSource {
  async fetchProfileDetail(): Promise<ProfileDetailDto> {
    const response = await axiosClient.get('/api/v1/profiles/detail');
    return profileDetailDtoSchema.parse(response.data.data);
  }

  async patchProfile(request: ProfileEditRequest): Promise<ProfileSummaryDto> {
    const response = await axiosClient.post('/api/v1/profiles/edit', request);
    return profileSummaryDtoSchema.parse(response.data.data);
  }

  async fetchBadges(): Promise<BadgeListDto> {
    const response = await axiosClient.get('/api/v1/profiles/badges');
    return badgeListDtoSchema.parse(response.data.data);
  }
}
