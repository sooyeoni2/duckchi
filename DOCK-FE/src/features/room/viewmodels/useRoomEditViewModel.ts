import { useCallback } from 'react';
import { create } from 'zustand';
import type { MeetingRoomTag } from '../models/roomMockData';
import { updateRoomInfo } from '../models/roomService';
import { Alert } from 'react-native';

interface RoomEditState {
  name: string;
  category: MeetingRoomTag;
  detail: string;
  isSaving: boolean;
}

interface RoomEditStore {
  state: RoomEditState;
  updateState: (partial: Partial<RoomEditState>) => void;
}

const initialState: RoomEditState = {
  name: 'C102 회식',
  category: '회식',
  detail: 'C102 뒷풀이',
  isSaving: false,
};

const useRoomEditStore = create<RoomEditStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomEditViewModel = (roomId: number) => {
  const { state, updateState } = useRoomEditStore();

  const setName = useCallback((name: string) => {
    updateState({ name });
  }, [updateState]);

  const setCategory = useCallback((category: MeetingRoomTag) => {
    updateState({ category });
  }, [updateState]);

  const setDetail = useCallback((detail: string) => {
    updateState({ detail });
  }, [updateState]);

  const saveRoomInfo = useCallback(async () => {
    if (!state.name.trim()) {
      Alert.alert('오류', '모임방 이름을 입력해주세요.');
      return false;
    }
    
    try {
      updateState({ isSaving: true });
      // TODO: 실제로 백엔드로 detail, category 등도 보내야할 수 있지만 현재 백엔드(ROOM-05) 스펙 확인 필요
      await updateRoomInfo(roomId, { roomName: state.name });
      updateState({ isSaving: false });
      return true;
    } catch (error: any) {
      updateState({ isSaving: false });
      Alert.alert('모임방 수정 실패', error?.response?.data?.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to update room:', error);
      return false;
    }
  }, [roomId, state.name, updateState]);

  return {
    state,
    setName,
    setCategory,
    setDetail,
    saveRoomInfo,
  };
};
