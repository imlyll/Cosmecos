import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      // True once the stored token has been verified with the API on this page load.
      sessionChecked: false,
      setAuth: ({ token, user }) => set({ token, user, sessionChecked: true }),
      setUser: (user) => set({ user }),
      setSessionChecked: (sessionChecked) => set({ sessionChecked }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'cosmecos-auth',
      partialize: ({ token, user }) => ({ token, user }),
    }
  )
);

export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.token));
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
