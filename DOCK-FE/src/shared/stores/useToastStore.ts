import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastActions {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  isVisible: false,
  message: '',
  type: 'info',
  duration: 3000,

  showToast: (message, type = 'info', duration = 3000) => {
    set({
      isVisible: true,
      message,
      type,
      duration,
    });
  },

  hideToast: () => {
    set({ isVisible: false });
  },
}));
