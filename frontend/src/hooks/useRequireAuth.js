import { useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';

/**
 * Wraps an action so guests are asked to sign in first; the action then
 * runs automatically once they have logged in or registered.
 */
export function useRequireAuth() {
  const openAuth = useUIStore((s) => s.openAuth);
  return useCallback(
    (action) => {
      if (useAuthStore.getState().token) return action();
      openAuth('login', action);
    },
    [openAuth]
  );
}
