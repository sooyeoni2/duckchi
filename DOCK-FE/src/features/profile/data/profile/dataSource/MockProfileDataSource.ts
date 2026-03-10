import type { BadgeListDto, ProfileDetailDto, ProfileEditRequest, ProfileSummaryDto } from '../profileDto';
import type { ProfileDataSource } from './ProfileDataSource';

const mockProfileDetail: ProfileDetailDto = {
  userId: 1,
  email: 'test@ssafy.co.kr',
  name: '김싸피',
  tag: '#DADADA',
  transferLimit: 30000,
  createdAt: '2026-03-04T12:41:30+09:00',
  profileImageUrl: 'https://i.pravatar.cc/150?img=3',
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

  async patchProfile(request: ProfileEditRequest): Promise<ProfileSummaryDto> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    if (request.transferLimit !== undefined) {
      this.profileDetail = { ...this.profileDetail, transferLimit: request.transferLimit };
    }
    if (request.profileImageKey !== undefined) {
      this.profileDetail = {
        ...this.profileDetail,
        profileImageUrl: `https://cdn.example.com/${request.profileImageKey}`,
      };
    }
    const { accounts: _a, badges: _b, ...summary } = this.profileDetail;
    return summary;
  }

  async fetchBadges(): Promise<BadgeListDto> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return mockBadgeList;
  }
}

export const mockProfileDataSource = new MockProfileDataSource();
