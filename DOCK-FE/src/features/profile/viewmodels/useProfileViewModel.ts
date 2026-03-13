import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

import { deleteAccount as deleteAccountService, fetchProfile } from '../models/profileService';
import type { Profile } from '../models/profileTypes';

type ProfileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; profile: Profile }
  | { status: 'error'; message: string };

interface ProfileStore {
  state: ProfileState;
  setState: (state: ProfileState) => void;
}

const useProfileStore = create<ProfileStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
}));

export const useProfileViewModel = () => {
  const { state, setState } = useProfileStore();

  const loadProfile = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const profile = await fetchProfile();
      setState({ status: 'loaded', profile });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '프로필을 불러올 수 없습니다.',
      });
    }
  }, [setState]);

  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const deleteAccount = useCallback(async (accountId: number) => {
    await deleteAccountService(accountId);
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { state, refresh, deleteAccount };
};
