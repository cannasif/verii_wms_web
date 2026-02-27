import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      pageTitle: null,
      setPageTitle: (title) => set({ pageTitle: title }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }),
    }
  )
);

