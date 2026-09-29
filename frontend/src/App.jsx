import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import Storefront from './Storefront';
import { SessionLoader } from './components/auth/ProtectedRoute';
import { useSessionBootstrap } from './hooks/useSession';
import { useTheme } from './context/ThemeContext';
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
  const { isDark } = useTheme();

  return (
    <>
      <Routes>
        <Route
          path="/admin/*"
          element={
            // The admin panel is designed for the light palette only.
            <div className="theme-light min-h-screen bg-cream text-body">
              <Suspense fallback={<SessionLoader />}>
                <AdminApp />
              </Suspense>
            </div>
          }
        />
        <Route path="*" element={<Storefront />} />
      </Routes>
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          style: {
            background: isDark ? '#242120' : '#141414',
            color: '#fbf7f3',
            border: isDark ? '1px solid #3a3531' : 'none',
            borderRadius: 0,
            fontFamily: 'Jost, sans-serif',
            letterSpacing: '0.02em',
          },
        }}
      />
    </>
  );
}
