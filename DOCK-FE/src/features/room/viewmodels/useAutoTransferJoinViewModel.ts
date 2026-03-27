import { useCallback } from 'react';
import { create } from 'zustand';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';
import {
  joinRoomByInviteToken,
  updateAutoDebitConsent,
  validateInviteLink,
  createInviteLink,
} from '../models/roomService';
import { Alert } from 'react-native';

interface AutoTransferJoinState {
  isProcessing: boolean;
  roomTitle: string;
  creatorName: string;
  inviteLink: string;
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
  | { type: 'failed' }
  | { type: 'consent-only' }
  | { type: 'invite-joined'; roomId: number }
  | { type: 'already-participant'; roomId: number };

const initialState: AutoTransferJoinState = {
  isProcessing: false,
  roomTitle: '',
  creatorName: '',
  inviteLink: '',
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
      let joinedByInvite = false;

      if (inviteToken) {
        try {
          const joined = await joinRoomByInviteToken(inviteToken);
          targetRoomId = joined.roomId ?? roomId;
          joinedByInvite = true;
        } catch (joinError: any) {
          if (getErrorCode(joinError) === 'ROOM-409-1') {
            // 왜: 중복 참여 응답은 실패가 아니라 이미 참가 완료 상태로 간주해야 화면 흐름이 끊기지 않는다.
            updateState({ isProcessing: false });
            return { type: 'already-participant', roomId: targetRoomId };
          }
          throw joinError;
        }
      }

      // 왜: inviteToken 기반 참가는 기본값이 isAgreed=false로 생성되므로, 동의 선택 시에는 참가 직후 상태를 확정 저장해야 한다.
      try {
        await updateAutoDebitConsent(targetRoomId, status);
      } catch (consentError: any) {
        if (joinedByInvite) {
          // 왜: ROOM-19가 이미 성공한 상태라면 동의 저장 실패가 있어도 모임 진입 자체는 막지 않아야 사용자가 고립되지 않는다.
          updateState({ isProcessing: false });
          Alert.alert(
            '안내',
            getErrorMessage(consentError, '모임 참여는 완료되었고 자동이체 설정 저장에 실패했습니다.'),
          );
          return { type: 'invite-joined', roomId: targetRoomId };
        }
        throw consentError;
      }

      updateState({ isProcessing: false });
      if (inviteToken) {
        return { type: 'invite-joined', roomId: targetRoomId };
      }
      return { type: 'consent-only' };
    } catch (e: any) {
      updateState({ isProcessing: false });
      Alert.alert('오류', getErrorMessage(e, '처리 중 오류가 발생했습니다.'));
      console.error(e);
      return { type: 'failed' };
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
  
  const fetchInviteLink = useCallback(async () => {
    try {
      updateState({ isProcessing: true });
      const response = await createInviteLink(roomId);
      updateState({ inviteLink: response.inviteLink, isProcessing: false });
      return response.inviteLink;
    } catch (e: any) {
      updateState({ isProcessing: false });
      // Error handling is handled by caller or kept silent for now
      console.error('Failed to create invite link:', e);
      return '';
    }
  }, [roomId, updateState]);

  return { 
    state: { ...state, transferLimit, userName }, 
    setRoomInfo,
    validateInviteBeforeJoin,
    agreeAndJoin, 
    skipAndJoin,
    fetchInviteLink
  };
};
