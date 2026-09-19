import { create } from 'zustand';
import type { ToastMessage } from '../types/index.ts';

export type ActiveTab = 'generator' | 'matrix' | 'products' | 'catalog' | 'settings';

interface ConfirmationModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface UiStoreState {
  activeTab: ActiveTab;
  toasts: ToastMessage[];
  confirmationModal: ConfirmationModalOptions | null;
  isExcelModalOpen: boolean;
  editingProductId: string | null;

  setActiveTab: (tab: ActiveTab) => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showConfirmation: (options: ConfirmationModalOptions) => void;
  closeConfirmation: () => void;
  setExcelModalOpen: (open: boolean) => void;
  setEditingProductId: (id: string | null) => void;
}

export const useUiStore = create<UiStoreState>((set, get) => ({
  activeTab: 'generator',
  toasts: [],
  confirmationModal: null,
  isExcelModalOpen: false,
  editingProductId: null,

  setActiveTab: (activeTab: ActiveTab) => set({ activeTab }),

  showToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  showConfirmation: (options: ConfirmationModalOptions) => {
    set({ confirmationModal: options });
  },

  closeConfirmation: () => {
    set({ confirmationModal: null });
  },

  setExcelModalOpen: (open: boolean) => set({ isExcelModalOpen: open }),

  setEditingProductId: (id: string | null) => {
    set({ editingProductId: id });
    if (id) {
      set({ activeTab: 'generator' });
    }
  },
}));
