import type { ProfileRepository, ProfileEditParams } from '../ProfileRepository';
import type { ProfileSummaryEntity } from '../ProfileEntity';

export class UpdateProfileUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(params: ProfileEditParams): Promise<ProfileSummaryEntity> {
    if (params.transferLimit === undefined && params.profileImageKey === undefined) {
      throw new Error('수정할 값이 올바르지 않습니다.');
    }

    return await this.profileRepo.patchProfile(params);
  }
}
