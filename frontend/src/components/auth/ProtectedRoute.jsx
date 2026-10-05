import { Navigate, useLocation } from 'react-router';
import { motion, useIsPresent } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { useTranslation } from 'react-i18next';

export function SessionLoader() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label={t('a11y.checkingSession')}>
      <motion.span
        className="font-serif text-4xl text-rose italic"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        cosmecos
      </motion.span>
    </div>
  );
}

/**
 * Sends guests to `redirectTo`, remembering where they were headed.
 * While a stored token is still being verified, shows a loader instead of flashing a redirect.
 * With `role`, signed-in users without that role are sent to `forbiddenTo`.
 */
export default function ProtectedRoute({ children, role, redirectTo = '/login', forbiddenTo = '/' }) {
  const { token, user, sessionChecked } = useAuthStore();
  const location = useLocation();
  // False while the page plays its exit transition after navigating away.
  const isPresent = useIsPresent();

  if (token && !sessionChecked) return <SessionLoader />;
  if (!token) {
    // A page on its way out must not redirect: that would override where the user just went
    // (e.g. home after deleting their account).
    if (!isPresent) return null;
    return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && user?.role !== role) return <Navigate to={forbiddenTo} replace />;
  return children;
}
