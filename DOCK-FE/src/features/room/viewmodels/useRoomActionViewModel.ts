import { useCallback } from 'react';
import { create } from 'zustand';
import { Alert } from 'react-native';
import { startMeetingRoom, endMeetingRoom, leaveMeetingRoom, deleteMeetingRoom } from '../models/roomService';

interface RoomActionState {
  status: 'READY' | 'START' | 'END';
  isProcessing: boolean;
}

interface RoomActionStore {
  state: RoomActionState;
  updateState: (partial: Partial<RoomActionState>) => void;
}

const initialState: RoomActionState = {
  status: 'READY',
  isProcessing: false,
};

const useRoomActionStore = create<RoomActionStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomActionViewModel = (roomId: number) => {
  const { state, updateState } = useRoomActionStore();

  const startRoom = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await startMeetingRoom(roomId);
      updateState({ status: 'START', isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('모임 시작 실패', e?.response?.data?.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to start room:', e);
      return false;
    }
  }, [roomId, updateState]);

  const endRoom = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await endMeetingRoom(roomId);
      updateState({ status: 'END', isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('모임 종료 실패', e?.response?.data?.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to end room:', e);
      return false;
    }
  }, [roomId, updateState]);

  const leaveRoom = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await leaveMeetingRoom(roomId);
      updateState({ isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('방 나가기 실패', e?.response?.data?.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to leave room:', e);
      return false;
    }
  }, [roomId, updateState]);

  const deleteRoom = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await deleteMeetingRoom(roomId);
      updateState({ isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('방 삭제 실패', e?.response?.data?.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to delete room:', e);
      return false;
    }
  }, [roomId, updateState]);

  return {
    state,
    startRoom,
    endRoom,
    deleteRoom,
    leaveRoom,
  };
};
