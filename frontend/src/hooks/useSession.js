import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

/**
 * Runs once at the app root:
 *  - on refresh, verifies the persisted token with /auth/me and refreshes the user
 *    (an invalid/expired token is cleared by the axios 401 interceptor);
 *  - keeps sessions in sync across browser tabs (log in/out in one, the others follow).
 */
export function useSessionBootstrap() {
  const qc = useQueryClient();

  useEffect(() => {
    const { token, setUser, setSessionChecked } = useAuthStore.getState();
    if (!token) {
      setSessionChecked(true);
      return;
    }
    let cancelled = false;
    api('/auth/me')
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => {
        // 401s already logged out via the interceptor; network errors keep the cached session.
      })
      .finally(() => !cancelled && setSessionChecked(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== useAuthStore.persist.getOptions().name) return;
      const before = useAuthStore.getState().token;
      useAuthStore.persist.rehydrate();
      if (useAuthStore.getState().token !== before) qc.invalidateQueries();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [qc]);
}
