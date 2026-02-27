import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  branch: Branch | null;
  setAuth: (user: User, token: string, branch: Branch | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      branch: null,
      setAuth: (user, token, branch) => {
        localStorage.setItem('access_token', token);
        set({ user, token, branch });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, branch: null });
      },
      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, branch: state.branch }),
    }
  )
);

