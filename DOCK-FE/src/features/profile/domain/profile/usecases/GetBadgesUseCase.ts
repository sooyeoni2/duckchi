import type { ProfileRepository } from '../ProfileRepository';
import type { BadgeListEntity } from '../ProfileEntity';

export class GetBadgesUseCase {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async execute(): Promise<BadgeListEntity> {
    return await this.profileRepo.fetchBadges();
  }
}
