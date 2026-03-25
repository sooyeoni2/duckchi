import { useCallback } from 'react';
import { create } from 'zustand';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';
import { updateAutoDebitConsent } from '../models/roomService';
import { Alert } from 'react-native';

interface AutoTransferJoinState {
  isProcessing: boolean;
  roomTitle: string;
  creatorName: string;
}

interface AutoTransferJoinStore {
  state: AutoTransferJoinState;
  updateState: (partial: Partial<AutoTransferJoinState>) => void;
}

const initialState: AutoTransferJoinState = {
  isProcessing: false,
  roomTitle: '',
  creatorName: '',
};

const useAutoTransferJoinStore = create<AutoTransferJoinStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

export const useAutoTransferJoinViewModel = (roomId: number) => {
  const { state, updateState } = useAutoTransferJoinStore();
  const { state: profileState } = useProfileViewModel();
  const transferLimit = profileState.status === 'loaded' ? (profileState.profile.transferLimit ?? 0) : 0;
  const userName = profileState.status === 'loaded' ? profileState.profile.name : '나';

  const setRoomInfo = useCallback((title: string) => {
    updateState({ roomTitle: title, creatorName: userName });
  }, [updateState, userName]);

  const agreeAndJoin = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await updateAutoDebitConsent(roomId, 'AGREED');
      updateState({ isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('오류', e?.response?.data?.message || '자동이체 동의 중 오류가 발생했습니다.');
      console.error(e);
      return false;
    }
  }, [roomId, updateState]);

  const skipAndJoin = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      await updateAutoDebitConsent(roomId, 'DECLINED');
      updateState({ isProcessing: false });
      return true;
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('오류', e?.response?.data?.message || '처리 중 오류가 발생했습니다.');
      console.error(e);
      return false;
    }
  }, [roomId, updateState]);

  return { 
    state: { ...state, transferLimit, userName }, 
    setRoomInfo,
    agreeAndJoin, 
    skipAndJoin 
  };
};
