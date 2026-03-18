import { create } from 'zustand';

import { meetingRoomMockData, type MeetingRoom, type MeetingRoomDraft } from './roomMockData';

let nextRoomId = 200;

interface RoomState {
  rooms: MeetingRoom[];
  addRoom: (draft: MeetingRoomDraft) => MeetingRoom;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [...meetingRoomMockData],

  addRoom: (draft) => {
    const newRoom: MeetingRoom = {
      roomId: ++nextRoomId,
      roomName: draft.roomName,
      category: draft.category,
      description: draft.description,
      participants: [],
      totalPay: 0,
      payCount: 0,
      percent: 0,
      memberCount: 1,
      completedCount: 0,
      totalCount: 1,
      extraMemberCount: 0,
      status: 'STARTED',
      actionLabel: '종료하기',
    };

    set({ rooms: [...get().rooms, newRoom] });
    return newRoom;
  },
}));
