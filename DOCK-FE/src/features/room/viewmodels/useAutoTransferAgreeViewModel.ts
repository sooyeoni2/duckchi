import { useCallback } from 'react';
import { create } from 'zustand';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';

interface AutoTransferAgreeState {
  isAgreed: boolean;
  roomTitle: string;
  agreedDate: string | null;
  isConfirmModalVisible: boolean;
}

interface AutoTransferAgreeStore {
  state: AutoTransferAgreeState;
  updateState: (partial: Partial<AutoTransferAgreeState>) => void;
}

const initialState: AutoTransferAgreeState = {
  isAgreed: false,
  roomTitle: 'C102 회식',
  agreedDate: null,
  isConfirmModalVisible: false,
};

const useAutoTransferAgreeStore = create<AutoTransferAgreeStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useAutoTransferAgreeState = () =>
  useAutoTransferAgreeStore((store) => store.state);

export const useAutoTransferAgreeViewModel = () => {
  const { state, updateState } = useAutoTransferAgreeStore();
  const { state: profileState } = useProfileViewModel();
  const transferLimit = profileState.status === 'loaded' ? (profileState.profile.transferLimit ?? 0) : 0;

  const openConfirmModal = useCallback(() => {
    updateState({ isConfirmModalVisible: true });
  }, [updateState]);

  const closeConfirmModal = useCallback(() => {
    updateState({ isConfirmModalVisible: false });
  }, [updateState]);

  const toggleAgreement = useCallback(() => {
    // 실제로는 API 연동 (ROOM-14) 로직이 들어갈 자리입니다.
    if (state.isAgreed) {
      updateState({ isAgreed: false, agreedDate: null });
    } else {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      updateState({ isAgreed: true, agreedDate: formattedDate });
    }
  }, [state.isAgreed, updateState]);

  return { state: { ...state, transferLimit }, openConfirmModal, closeConfirmModal, toggleAgreement };
};
