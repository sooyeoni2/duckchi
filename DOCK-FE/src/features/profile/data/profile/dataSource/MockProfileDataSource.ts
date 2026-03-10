import type { BadgeListDto, ProfileDetailDto, ProfileSummaryDto } from '../profileDto';
import type { ProfileDataSource } from './ProfileDataSource';

const mockProfileDetail: ProfileDetailDto = {
  userId: 1,
  email: 'test@ssafy.co.kr',
  name: '우주',
  tag: '#1A3',
  transferLimit: 30000,
  createdAt: '2026-03-04T12:41:30+09:00',
  accounts: [
    {
      accountId: 10,
      bankCode: '088',
      bankName: '신한은행',
      accountNumber: '1234************',
      registeredAt: '2026-03-04T15:30:00+09:00',
    },
  ],
  badges: [
    {
      id: 2,
      code: 'FAST_SETTLER',
      name: '⚡ 번개 정산러',
      isAcquired: true,
      requiredAt: '2026-03-04T15:30:00+09:00',
    },
    {
      id: 3,
      code: 'INSSA',
      name: '⚡ 프로 참여러',
      isAcquired: false,
      requiredAt: '2026-03-04T15:30:00+09:00',
    },
  ],
};

const mockBadgeList: BadgeListDto = {
  acquiredBadges: [
    {
      id: 2,
      code: 'FAST_SETTLER',
      name: '⚡ 번개 정산러',
      acquiredAt: '2026-03-04T15:30:00+09:00',
      description: '24h이내 10회',
    },
    {
      id: 3,
      code: 'INSSA',
      name: '⚡ 프로 참여러',
      acquiredAt: '2026-03-04T15:30:00+09:00',
      description: '모임 참여 10회 이상',
    },
  ],
  lockedBadges: [
    {
      id: 4,
      code: 'EARLY_BIRD',
      name: '🌅 얼리버드',
      description: '오전 7시 이전 정산 3회',
      requiredCount: 3,
      currentCount: 1,
    },
  ],
};

export class MockProfileDataSource implements ProfileDataSource {
  private profileDetail: ProfileDetailDto = { ...mockProfileDetail };

  async fetchProfileDetail(): Promise<ProfileDetailDto> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return this.profileDetail;
  }

  async patchProfile(transferLimit: number): Promise<ProfileSummaryDto> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    this.profileDetail = { ...this.profileDetail, transferLimit };
    const { accounts: _a, badges: _b, ...summary } = this.profileDetail;
    return summary;
  }

  async fetchBadges(): Promise<BadgeListDto> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return mockBadgeList;
  }
}

export const mockProfileDataSource = new MockProfileDataSource();
