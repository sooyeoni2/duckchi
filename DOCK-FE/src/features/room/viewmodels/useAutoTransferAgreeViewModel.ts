import { useCallback } from 'react';
import { create } from 'zustand';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';
import { getAutoDebitConsent, updateAutoTransferAgree } from '../models/roomService';

interface AutoTransferAgreeState {
  isAgreed: boolean;
  roomTitle: string;
  agreedDate: string | null;
  isConfirmModalVisible: boolean;
  isLoading: boolean;
}

interface AutoTransferAgreeStore {
  state: AutoTransferAgreeState;
  updateState: (partial: Partial<AutoTransferAgreeState>) => void;
}

const initialState: AutoTransferAgreeState = {
  isAgreed: false,
  roomTitle: '모임방', // 임시
  agreedDate: null,
  isConfirmModalVisible: false,
  isLoading: false,
};

const useAutoTransferAgreeStore = create<AutoTransferAgreeStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useAutoTransferAgreeState = () =>
  useAutoTransferAgreeStore((store) => store.state);

export const useAutoTransferAgreeViewModel = (roomId?: number, roomName?: string) => {
  const { state, updateState } = useAutoTransferAgreeStore();
  const { state: profileState } = useProfileViewModel();
  const transferLimit = profileState.status === 'loaded' ? (profileState.profile.transferLimit ?? 0) : 0;

  const fetchConsent = useCallback(async () => {
    if (!roomId) return;
    try {
      updateState({ isLoading: true });
      const res = await getAutoDebitConsent(roomId);
      const isAgreedLocal = (res as any).isAgreed ?? (res as any).agreed ?? false;
      const today = new Date();
      // 백엔드에서 날짜를 주지 않으므로 임시로 오늘 날짜를 표기
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      updateState({ 
        isAgreed: isAgreedLocal, 
        ...(roomName ? { roomTitle: roomName } : {}),
        agreedDate: isAgreedLocal ? formattedDate : null,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch auto debit consent', e);
      updateState({ isLoading: false });
    }
  }, [roomId, roomName, updateState]);

  const openConfirmModal = useCallback(() => {
    updateState({ isConfirmModalVisible: true });
  }, [updateState]);

  const closeConfirmModal = useCallback(() => {
    updateState({ isConfirmModalVisible: false });
  }, [updateState]);

  const toggleAgreement = useCallback(async () => {
    if (!roomId) return;
    try {
      await updateAutoTransferAgree(roomId); // ROOM-14 연동
      closeConfirmModal();
      await fetchConsent(); // 토글 후 재조회
    } catch (e) {
      console.error('Failed to toggle auto transfer agree', e);
    }
  }, [roomId, fetchConsent, closeConfirmModal]);

  return { state: { ...state, transferLimit }, openConfirmModal, closeConfirmModal, toggleAgreement, fetchConsent };
};
