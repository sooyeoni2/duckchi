import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

import { fetchBadges } from '../models/profileService';
import type { BadgeList } from '../models/profileTypes';

type BadgeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; data: BadgeList }
  | { status: 'error'; message: string };

interface BadgeStore {
  state: BadgeState;
  setState: (state: BadgeState) => void;
}

const useBadgeStore = create<BadgeStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
}));

export const useBadgeViewModel = () => {
  const { state, setState } = useBadgeStore();

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetchBadges();
      setState({ status: 'loaded', data });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '뱃지를 불러올 수 없습니다.',
      });
    }
  }, [setState]);

  useEffect(() => {
    if (state.status === 'idle') {
      load();
    }
  }, [load, state.status]);

  return { state, reload: load };
};
