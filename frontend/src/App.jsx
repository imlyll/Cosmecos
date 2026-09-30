import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import Storefront from './Storefront';
import { SessionLoader } from './components/auth/ProtectedRoute';
import { useSessionBootstrap } from './hooks/useSession';
import i18n from './i18n';

// The admin panel is its own bundle; shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** Catalog queries are keyed by language; the cart and wishlist (which embed product names) are refetched. */
function useRefetchOnLanguageChange() {
  const qc = useQueryClient();
  useEffect(() => {
    const onChange = () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    };
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, [qc]);
}

export default function App() {
  useSessionBootstrap();
  useRefetchOnLanguageChange();

  return (
    <>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<SessionLoader />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Storefront />} />
      </Routes>
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          style: {
            background: '#141414',
            color: '#fbf7f3',
            border: 'none',
            borderRadius: 0,
            fontFamily: 'Jost, sans-serif',
            letterSpacing: '0.02em',
          },
        }}
      />
    </>
  );
}
