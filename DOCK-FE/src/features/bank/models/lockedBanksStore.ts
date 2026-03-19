import { create } from 'zustand';

const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

interface LockedBanksStore {
  lockedBanks: Record<string, number>; // bankCode -> lockedAt timestamp
  lockBank: (bankCode: string) => void;
  isLocked: (bankCode: string) => boolean;
}

export const useLockedBanksStore = create<LockedBanksStore>((set, get) => ({
  lockedBanks: {},
  lockBank: (bankCode) =>
    set(state => ({
      lockedBanks: { ...state.lockedBanks, [bankCode]: Date.now() },
    })),
  isLocked: (bankCode) => {
    const lockedAt = get().lockedBanks[bankCode];
    if (!lockedAt) return false;
    return Date.now() - lockedAt < LOCK_DURATION_MS;
  },
}));
