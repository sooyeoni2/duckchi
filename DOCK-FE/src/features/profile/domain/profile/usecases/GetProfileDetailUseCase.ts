import type { ProfileRepository } from '../ProfileRepository';
import type { ProfileEntity } from '../ProfileEntity';

export class GetProfileDetailUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(): Promise<ProfileEntity> {
    return await this.profileRepo.fetchProfileDetail();
  }
}
