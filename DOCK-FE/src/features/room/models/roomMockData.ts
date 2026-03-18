export type MeetingRoomStatus = 'STARTED' | 'ENDED';

export type MeetingRoomTag =
  | '회식'
  | '여행'
  | '데이트'
  | '취미'
  | '일회성 만남'
  | '기타';

export interface MeetingRoom {
  roomId: number;
  roomName: string;
  category: MeetingRoomTag;
  description: string;
  participants: string[];
  totalPay: number;
  payCount: number;
  percent: number;
  memberCount: number;
  completedCount: number;
  totalCount: number;
  extraMemberCount: number;
  status: MeetingRoomStatus;
  actionLabel: string;
}

export interface MeetingRoomDraft {
  roomName: string;
  category: MeetingRoomTag;
  description: string;
}

export interface MeetingRoomInviteLink {
  roomId: number;
  inviteLink: string;
  inviteToken: string;
  status: 'ACTIVE';
  expiresAt: string;
  regenerated: boolean;
}

export const meetingRoomMockData: MeetingRoom[] = [
  {
    roomId: 101,
    roomName: 'C102 회식',
    category: '회식',
    description: 'C102 뒷풀이',
    participants: ['지수', '민서', '도윤', '서연'],
    totalPay: 180000,
    payCount: 2,
    percent: 75,
    memberCount: 6,
    completedCount: 5,
    totalCount: 6,
    extraMemberCount: 2,
    status: 'STARTED',
    actionLabel: '종료하기',
  },
  {
    roomId: 102,
    roomName: 'C102 여행',
    category: '여행',
    description: '경주월드',
    participants: ['지수', '태현', '윤아', '현우'],
    totalPay: 156000,
    payCount: 3,
    percent: 100,
    memberCount: 6,
    completedCount: 6,
    totalCount: 6,
    extraMemberCount: 2,
    status: 'ENDED',
    actionLabel: '시작하기',
  },
];

export const createMeetingRoomDraftMock: MeetingRoomDraft = {
  roomName: '',
  category: '회식',
  description: '',
};

export const getMeetingRoomRestartDraft = (roomId: number): MeetingRoomDraft => {
  const room = meetingRoomMockData.find((item) => item.roomId === roomId);

  if (room == null) {
    return createMeetingRoomDraftMock;
  }

  return {
    roomName: room.roomName,
    category: room.category,
    description: room.description,
  };
};

export const getMeetingRoomInviteLinkMock = (roomId: number): MeetingRoomInviteLink => ({
  roomId,
  inviteLink: `https://duckchi.app/invite/mock-room-${roomId}`,
  inviteToken: `mock-room-${roomId}`,
  status: 'ACTIVE',
  expiresAt: '2026-03-20T14:00:00+09:00',
  regenerated: false,
});
