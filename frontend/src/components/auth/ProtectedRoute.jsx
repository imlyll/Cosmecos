import { Navigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';

export function SessionLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Checking your session">
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

  if (token && !sessionChecked) return <SessionLoader />;
  if (!token) return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  if (role && user?.role !== role) return <Navigate to={forbiddenTo} replace />;
  return children;
}
