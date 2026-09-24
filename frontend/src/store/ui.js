import { create } from 'zustand';

/** Global UI state: overlays, drawers and the "do this after signing in" action. */
export const useUIStore = create((set, get) => ({
  authModal: { open: false, view: 'login' },
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  panelOpen: false,
  pendingAction: null,
  couponCode: '',

  openAuth: (view = 'login', pendingAction = null) => set({ authModal: { open: true, view }, pendingAction }),
  setAuthView: (view) => set((s) => ({ authModal: { ...s.authModal, view } })),
  closeAuth: () => set((s) => ({ authModal: { ...s.authModal, open: false }, pendingAction: null })),
  /** Runs (and clears) the action a guest tried before being asked to sign in. */
  runPendingAction: () => {
    const action = get().pendingAction;
    set({ pendingAction: null });
    if (action) action();
  },

  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setCouponCode: (couponCode) => set({ couponCode }),
}));
