import { create } from 'zustand';
import { getRoomLists } from './roomService';
import type { MeetingRoom, MeetingRoomDraft } from './roomMockData';

interface RoomState {
  rooms: MeetingRoom[];
  isLoading: boolean;
  error: string | null;
  fetchRooms: (isProgress?: boolean) => Promise<void>;
  addRoom: (draft: MeetingRoomDraft) => MeetingRoom; // 클라이언트 단 임시 추가용
}

export const useRoomStore = create<RoomState>((set, _get) => ({
  rooms: [],
  isLoading: false,
  error: null,

  fetchRooms: async (isProgress?: boolean) => {
    try {
      set({ isLoading: true, error: null });
      const apiRooms = await getRoomLists(isProgress);
      
      const mappedRooms: MeetingRoom[] = apiRooms.map(room => ({
        roomId: room.roomId,
        roomName: room.roomName,
        category: room.category as any,
        description: '', // 백엔드 목록 조회에서 미제공
        participants: room.participants.map(id => String(id)),
        totalPay: room.totalPay,
        payCount: room.payCount,
        percent: room.percent,
        memberCount: room.participantCount,
        completedCount: 0, // 백엔드 미제공 대체값
        totalCount: room.participantCount,
        extraMemberCount: room.participantCount > 4 ? room.participantCount - 4 : 0,
        status: room.isProgress ? 'STARTED' : 'ENDED',
        actionLabel: room.isProgress ? '종료하기' : '시작하기',
      }));

      set({ rooms: mappedRooms, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || '방 목록을 불러오는 데 실패했습니다.', isLoading: false });
    }
  },

  addRoom: (draft) => {
    // 임시로 추가하는 로직 (API를 통해 반영된 결과가 fetchRooms를 통해 최신화 되기 전에 로컬 반영용)
    const newRoom: MeetingRoom = {
      roomId: -1, // 임시
      roomName: draft.roomName,
      category: draft.category,
      description: draft.description,
      participants: ['나'],
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
    // set({ rooms: [...get().rooms, newRoom] }); 
    // 실제로는 fetchRooms 를 호출할 것이므로 임시 추가는 리스트 UI에서 관리하거나 무시합니다.
    return newRoom;
  },
}));
