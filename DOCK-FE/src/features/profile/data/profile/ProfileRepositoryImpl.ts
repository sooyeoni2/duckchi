import type { BadgeListEntity, ProfileEntity, ProfileSummaryEntity } from '../../domain/profile/ProfileEntity';
import type { ProfileEditRequest } from './profileDto';
import { ProfileMapper } from './profileMapper';
import type { ProfileDataSource } from './dataSource/ProfileDataSource';
import { mockProfileDataSource } from './dataSource/MockProfileDataSource';

export class ProfileRepositoryImpl {
  constructor(private readonly dataSource: ProfileDataSource = mockProfileDataSource) {}

  async fetchProfileDetail(): Promise<ProfileEntity> {
    const dto = await this.dataSource.fetchProfileDetail();
    return ProfileMapper.toEntity(dto);
  }

  async patchProfile(request: ProfileEditRequest): Promise<ProfileSummaryEntity> {
    const dto = await this.dataSource.patchProfile(request);
    return ProfileMapper.toSummaryEntity(dto);
  }

  async fetchBadges(): Promise<BadgeListEntity> {
    const dto = await this.dataSource.fetchBadges();
    return ProfileMapper.toBadgeListEntity(dto);
  }
}
