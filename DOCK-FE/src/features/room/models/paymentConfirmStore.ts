import { create } from 'zustand';

export type PaymentAction =
  | { type: 'single'; id: number }
  | { type: 'all' };

interface PaymentConfirmState {
  pendingAction: PaymentAction | null;
  confirmed: boolean;
  setPending: (action: PaymentAction) => void;
  confirm: () => void;
  consume: () => { action: PaymentAction; confirmed: boolean } | null;
}

export const usePaymentConfirmStore = create<PaymentConfirmState>((set, get) => ({
  pendingAction: null,
  confirmed: false,

  setPending: (action) => set({ pendingAction: action, confirmed: false }),

  confirm: () => set({ confirmed: true }),

  consume: () => {
    const { pendingAction, confirmed } = get();
    if (pendingAction === null) return null;
    set({ pendingAction: null, confirmed: false });
    return { action: pendingAction, confirmed };
  },
}));
