import { useCallback } from 'react';
import { create } from 'zustand';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';
import {
  joinRoomByInviteToken,
  updateAutoDebitConsent,
  validateInviteLink,
} from '../models/roomService';
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

type InviteValidationResult =
  | 'not-required'
  | 'valid'
  | 'already-participant'
  | 'invalid';

type JoinActionResult =
  | 'failed'
  | 'consent-only'
  | 'invite-joined'
  | 'already-participant';

const initialState: AutoTransferJoinState = {
  isProcessing: false,
  roomTitle: '',
  creatorName: '',
};

const useAutoTransferJoinStore = create<AutoTransferJoinStore>((set) => ({
  state: initialState,
  updateState: (partial) => set((store) => ({ state: { ...store.state, ...partial } })),
}));

const getErrorCode = (error: any): string =>
  error?.response?.data?.errorCode ??
  error?.response?.data?.errorcode ??
  '';

const getErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.msg ??
  error?.response?.data?.message ??
  fallback;

export const useAutoTransferJoinViewModel = (roomId: number) => {
  const { state, updateState } = useAutoTransferJoinStore();
  const { state: profileState } = useProfileViewModel();
  const transferLimit = profileState.status === 'loaded' ? (profileState.profile.transferLimit ?? 0) : 0;
  const userName = profileState.status === 'loaded' ? profileState.profile.name : '나';

  const setRoomInfo = useCallback((title: string) => {
    updateState({ roomTitle: title, creatorName: userName });
  }, [updateState, userName]);

  const validateInviteBeforeJoin = useCallback(async (
    inviteToken?: string,
  ): Promise<InviteValidationResult> => {
    if (!inviteToken) {
      return 'not-required';
    }

    try {
      const response = await validateInviteLink(inviteToken);
      if (response.alreadyParticipant) {
        return 'already-participant';
      }
      return response.valid ? 'valid' : 'invalid';
    } catch (e: any) {
      if (getErrorCode(e) === 'ROOM-409-1') {
        // 왜: 이미 참여자인 경우에는 동의 화면을 보여줄 필요 없이 바로 모임방으로 이동시키기 위함이다.
        return 'already-participant';
      }
      Alert.alert('초대 링크 오류', getErrorMessage(e, '유효하지 않은 초대 링크입니다.'));
      console.error(e);
      return 'invalid';
    }
  }, []);

  const processJoin = useCallback(async (
    status: 'AGREED' | 'DECLINED',
    inviteToken?: string,
  ): Promise<JoinActionResult> => {
    try {
      updateState({ isProcessing: true });
      let targetRoomId = roomId;

      if (inviteToken) {
        try {
          const joined = await joinRoomByInviteToken(inviteToken);
          targetRoomId = joined.roomId ?? roomId;
        } catch (joinError: any) {
          if (getErrorCode(joinError) === 'ROOM-409-1') {
            // 왜: 중복 참여 응답은 실패가 아니라 이미 참가 완료 상태로 간주해야 화면 흐름이 끊기지 않는다.
            updateState({ isProcessing: false });
            return 'already-participant';
          }
          throw joinError;
        }
      }

      // 왜: inviteToken 기반 참가는 기본값이 isAgreed=false로 생성되므로, 동의 선택 시에는 참가 직후 상태를 확정 저장해야 한다.
      await updateAutoDebitConsent(targetRoomId, status);

      updateState({ isProcessing: false });
      return inviteToken ? 'invite-joined' : 'consent-only';
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('오류', getErrorMessage(e, '처리 중 오류가 발생했습니다.'));
      console.error(e);
      return 'failed';
    }
  }, [roomId, updateState]);

  const agreeAndJoin = useCallback(
    async (inviteToken?: string) => processJoin('AGREED', inviteToken),
    [processJoin],
  );

  const skipAndJoin = useCallback(
    async (inviteToken?: string) => processJoin('DECLINED', inviteToken),
    [processJoin],
  );

  return { 
    state: { ...state, transferLimit, userName }, 
    setRoomInfo,
    validateInviteBeforeJoin,
    agreeAndJoin, 
    skipAndJoin 
  };
};
