import { useCallback } from 'react';
import { create } from 'zustand';

interface RoomEditState {
  name: string;
  category: string;
  isSaving: boolean;
}

interface RoomEditStore {
  state: RoomEditState;
  updateState: (partial: Partial<RoomEditState>) => void;
}

const initialState: RoomEditState = {
  name: 'C102 회식',
  category: '회식',
  isSaving: false,
};

const useRoomEditStore = create<RoomEditStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useRoomEditViewModel = () => {
  const { state, updateState } = useRoomEditStore();

  const setName = useCallback((name: string) => {
    updateState({ name });
  }, [updateState]);

  const setCategory = useCallback((category: string) => {
    updateState({ category });
  }, [updateState]);

  const saveRoomInfo = useCallback(async () => {
    updateState({ isSaving: true });
    // TODO: ROOM-05 API 연동 (PATCH /api/v1/rooms/{roomId})
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000)); // Mock API delay
    updateState({ isSaving: false });
    return true;
  }, [updateState]);

  return {
    state,
    setName,
    setCategory,
    saveRoomInfo,
  };
};
