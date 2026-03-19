import { useCallback } from 'react';
import { create } from 'zustand';

import { RoomActionType } from '../views/components/RoomActionConfirmBottomSheet';

// TODO: 나중에 모델과 API 연결 시 models/roomTypes.ts 로 분리할 타입입니다.
export interface RoomDetailMock {
  title: string;
  category: string;
  memberCount: number;
  status: 'READY' | 'START' | 'END';
  inviteLink: string;
  isAdmin: boolean;
}

interface RoomMoreOptionsState {
  roomInfo: RoomDetailMock;
  isInviteModalVisible: boolean;
  activeActionType: RoomActionType | null;
  isActionModalVisible: boolean;
}

interface RoomMoreOptionsStore {
  state: RoomMoreOptionsState;
  updateState: (partial: Partial<RoomMoreOptionsState>) => void;
}

// 목업 데이터 초기화
const initialState: RoomMoreOptionsState = {
  roomInfo: {
    title: 'C102 회식',
    category: '회식',
    memberCount: 6,
    status: 'READY',
    inviteLink: 'https://duckchi.com/invite/c102',
    isAdmin: true, // 목업 사용자 방장 설정
  },
  isInviteModalVisible: false,
  activeActionType: null,
  isActionModalVisible: false,
};

const useRoomMoreOptionsStore = create<RoomMoreOptionsStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomMoreOptionsViewModel = () => {
  const { state, updateState } = useRoomMoreOptionsStore();

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
    openInviteModal, 
    closeInviteModal,
    openActionModal,
    closeActionModal
  };
};
