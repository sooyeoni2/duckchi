import { useCallback } from 'react';
import { create } from 'zustand';

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

export const useRoomActionViewModel = () => {
  const { state, updateState } = useRoomActionStore();

  const startRoom = useCallback(async () => {
    updateState({ isProcessing: true });
    // TODO: ROOM-17 API 연동 (POST /api/v1/rooms/{roomId}/start)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    updateState({ status: 'START', isProcessing: false });
    return true;
  }, [updateState]);

  const endRoom = useCallback(async () => {
    updateState({ isProcessing: true });
    // TODO: ROOM-18 API 연동 (POST /api/v1/rooms/{roomId}/end)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    updateState({ status: 'END', isProcessing: false });
    return true;
  }, [updateState]);

  const deleteRoom = useCallback(async () => {
    updateState({ isProcessing: true });
    // TODO: ROOM-07 API 연동 (DELETE /api/v1/rooms/{roomId}/delete)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    updateState({ isProcessing: false });
    return true;
  }, [updateState]);

  const leaveRoom = useCallback(async () => {
    updateState({ isProcessing: true });
    // TODO: ROOM-06 API 연동 (DELETE /api/v1/rooms/{roomId}/members/left)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    updateState({ isProcessing: false });
    return true;
  }, [updateState]);

  return {
    state,
    startRoom,
    endRoom,
    deleteRoom,
    leaveRoom,
  };
};
