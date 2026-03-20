import { useCallback } from 'react';
import { create } from 'zustand';

export interface RoomMember {
  userId: number;
  profileUrl: string | null;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

interface RoomMembersState {
  members: RoomMember[];
  isLoading: boolean;
}

interface RoomMembersStore {
  state: RoomMembersState;
  updateState: (partial: Partial<RoomMembersState>) => void;
}

const mockMembers: RoomMember[] = [
  { userId: 1, profileUrl: null, name: '박성환', role: 'ADMIN' },
  { userId: 2, profileUrl: null, name: '정우주', role: 'MEMBER' },
  { userId: 3, profileUrl: null, name: '임찬혁', role: 'MEMBER' },
  { userId: 4, profileUrl: null, name: '강산천', role: 'MEMBER' },
  { userId: 5, profileUrl: null, name: '김수연', role: 'MEMBER' },
  { userId: 6, profileUrl: null, name: '류병선', role: 'MEMBER' },
];

const useRoomMembersStore = create<RoomMembersStore>((set) => ({
  state: {
    members: mockMembers,
    isLoading: false,
  },
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomMembersViewModel = () => {
  const { state, updateState } = useRoomMembersStore();

  const fetchMembers = useCallback(async (roomId: number) => {
    updateState({ isLoading: true });
    // TODO: ROOM-16 API 연동 (GET /api/v1/rooms/{roomId}/participants-lists)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
    updateState({ members: mockMembers, isLoading: false });
  }, [updateState]);

  return {
    state,
    fetchMembers,
  };
};
