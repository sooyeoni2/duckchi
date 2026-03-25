import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

import { deleteAccount as deleteAccountService, editProfileImage as editProfileImageService, fetchBadges, fetchProfile, updateTransferLimit as updateTransferLimitService } from '../models/profileService';
import type { Profile } from '../models/profileTypes';

type ProfileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; profile: Profile }
  | { status: 'error'; message: string };

interface ProfileStore {
  state: ProfileState;
  setState: (state: ProfileState) => void;
  reset: () => void;
}

const useProfileStore = create<ProfileStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
  reset: () => set({ state: { status: 'idle' } }),
}));

export const useProfileViewModel = () => {
  const { state, setState } = useProfileStore();

  const loadProfile = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [profile, badgeList] = await Promise.all([fetchProfile(), fetchBadges()]);
      const badges = [
        ...badgeList.acquiredBadges.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          isAcquired: true,
          acquiredAt: b.acquiredAt,
          imageUrl: b.imageUrl,
        })),
        ...badgeList.lockedBadges.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          isAcquired: false,
          acquiredAt: null,
          imageUrl: b.imageUrl,
        })),
      ];
      setState({ status: 'loaded', profile: { ...profile, badges } });
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

  const updateTransferLimit = useCallback(async (transferLimit: number) => {
    await updateTransferLimitService(transferLimit);
    await loadProfile();
  }, [loadProfile]);

  const deleteAccount = useCallback(async (accountId: number) => {
    await deleteAccountService(accountId);
    await loadProfile();
  }, [loadProfile]);

  const updateProfileImage = useCallback(async (profileImageKey: string) => {
    await editProfileImageService(profileImageKey);
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (useProfileStore.getState().state.status === 'idle') {
      loadProfile();
    }
  }, [loadProfile]);

  const reset = useProfileStore(s => s.reset);

  return { state, refresh, reset, deleteAccount, updateTransferLimit, updateProfileImage };
};
