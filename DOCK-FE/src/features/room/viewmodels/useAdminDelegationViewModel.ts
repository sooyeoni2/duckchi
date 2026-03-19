import { useCallback } from 'react';
import { create } from 'zustand';
import { RoomMember } from './useRoomMembersViewModel';

interface AdminDelegationState {
  members: RoomMember[];
  selectedUserId: number | null;
  isConfirmModalVisible: boolean;
}

interface AdminDelegationStore {
  state: AdminDelegationState;
  updateState: (partial: Partial<AdminDelegationState>) => void;
}

const mockMembers: RoomMember[] = [
  { userId: 1, profileUrl: null, name: '박성환', role: 'ADMIN' },
  { userId: 2, profileUrl: null, name: '정우주', role: 'MEMBER' },
  { userId: 3, profileUrl: null, name: '임찬혁', role: 'MEMBER' },
  { userId: 4, profileUrl: null, name: '강산천', role: 'MEMBER' },
  { userId: 5, profileUrl: null, name: '김수연', role: 'MEMBER' },
  { userId: 6, profileUrl: null, name: '류병선', role: 'MEMBER' },
];

const initialState: AdminDelegationState = {
  members: mockMembers,
  selectedUserId: null,
  isConfirmModalVisible: false,
};

const useAdminDelegationStore = create<AdminDelegationStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useAdminDelegationViewModel = () => {
  const { state, updateState } = useAdminDelegationStore();

  const selectParticipant = useCallback((userId: number) => {
    updateState({ selectedUserId: userId });
  }, [updateState]);

  const openConfirmModal = useCallback(() => {
    if (state.selectedUserId) {
      updateState({ isConfirmModalVisible: true });
    }
  }, [state.selectedUserId, updateState]);

  const closeConfirmModal = useCallback(() => {
    updateState({ isConfirmModalVisible: false });
  }, [updateState]);

  const confirmDelegation = useCallback(async () => {
    // TODO: ROOM-15 API 연동 (POST /api/v1/rooms/{roomId}/delegations)
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateState({ isConfirmModalVisible: false });
    return true;
  }, [updateState]);

  const selectedMemberName = state.members.find(m => m.userId === state.selectedUserId)?.name || '';

  return {
    state,
    selectedMemberName,
    selectParticipant,
    openConfirmModal,
    closeConfirmModal,
    confirmDelegation,
  };
};
