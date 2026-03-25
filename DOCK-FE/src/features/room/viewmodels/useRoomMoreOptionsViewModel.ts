import { useCallback } from 'react';
import { create } from 'zustand';
import { RoomActionType } from '../views/components/RoomActionConfirmBottomSheet';
import { getAutoDebitConsent } from '../models/roomService';
import { useRoomStore } from '../models/roomStore';

export interface RoomDetailState {
  title: string;
  category: string;
  memberCount: number;
  status: 'READY' | 'START' | 'END';
  isAdmin: boolean;
  isLoading: boolean;
}

interface RoomMoreOptionsState {
  roomInfo: RoomDetailState;
  isInviteModalVisible: boolean;
  activeActionType: RoomActionType | null;
  isActionModalVisible: boolean;
}

interface RoomMoreOptionsStore {
  state: RoomMoreOptionsState;
  updateState: (partial: Partial<RoomMoreOptionsState>) => void;
}

const initialState: RoomMoreOptionsState = {
  roomInfo: {
    title: '모임방',
    category: '기타',
    memberCount: 0,
    status: 'READY',
    isAdmin: false,
    isLoading: false,
  },
  isInviteModalVisible: false,
  activeActionType: null,
  isActionModalVisible: false,
};

const useRoomMoreOptionsStore = create<RoomMoreOptionsStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomMoreOptionsViewModel = (roomId: number) => {
  const { state, updateState } = useRoomMoreOptionsStore();

  const fetchRoomInfo = useCallback(async () => {
    if (!roomId) return;
    try {
      updateState({ roomInfo: { ...state.roomInfo, isLoading: true } });
      const consentRes = await getAutoDebitConsent(roomId);
      
      const currentRooms = (useRoomStore as any).getState().rooms;
      const currentRoomFromStore = (currentRooms as any[]).find((r: any) => r.roomId === roomId);

      updateState({
        roomInfo: {
          title: currentRoomFromStore?.roomName || '모임방',
          category: currentRoomFromStore?.category || '기타',
          memberCount: consentRes.participantCount,
          status: currentRoomFromStore?.status === 'STARTED' ? 'START' : 'READY',
          isAdmin: consentRes.role === 'ADMIN',
          isLoading: false,
        }
      });
    } catch (e) {
      console.error('Failed to fetch room info in more options', e);
      updateState({ roomInfo: { ...state.roomInfo, isLoading: false } });
    }
  }, [roomId, state.roomInfo, updateState]);

  const openInviteModal = useCallback(() => {
    updateState({ isInviteModalVisible: true });
  }, [updateState]);

  const closeInviteModal = useCallback(() => {
    updateState({ isInviteModalVisible: false });
  }, [updateState]);

  const openActionModal = useCallback((type: RoomActionType) => {
    updateState({ activeActionType: type, isActionModalVisible: true });
  }, [updateState]);

  const closeActionModal = useCallback(() => {
    updateState({ isActionModalVisible: false });
  }, [updateState]);

  return { 
    state, 
    fetchRoomInfo,
    openInviteModal, 
    closeInviteModal,
    openActionModal,
    closeActionModal
  };
};
