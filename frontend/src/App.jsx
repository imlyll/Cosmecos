import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import Storefront from './Storefront';
import { SessionLoader } from './components/auth/ProtectedRoute';
import { useSessionBootstrap } from './hooks/useSession';

// The admin panel is its own bundle; shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  useSessionBootstrap();

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
