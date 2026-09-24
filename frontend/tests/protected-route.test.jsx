import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import ProtectedRoute from '../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../src/store/auth';

function LoginPage() {
  const location = useLocation();
  return <p>login page, from={location.state?.from ?? '-'}</p>;
}

function renderAt(path, { role } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home page</p>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<p>admin login</p>} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <p>checkout page</p>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={role ?? 'admin'} redirectTo="/admin/login" forbiddenTo="/admin/login">
              <p>admin dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

const signIn = (role = 'user', sessionChecked = true) =>
  useAuthStore.setState({ token: 'jwt', user: { name: 'L', role }, sessionChecked });

describe('ProtectedRoute', () => {
  it('redirects guests to /login and remembers the target page', () => {
    renderAt('/checkout?step=2');
    expect(screen.getByText('login page, from=/checkout?step=2')).toBeTruthy();
  });

  it('shows a loader (not a redirect) while a stored token is being verified', () => {
    signIn('user', false);
    renderAt('/checkout');
    expect(screen.getByRole('status', { name: /checking your session/i })).toBeTruthy();
    expect(screen.queryByText(/login page/)).toBeNull();
  });

  it('renders the page for a verified user', () => {
    signIn();
    renderAt('/checkout');
    expect(screen.getByText('checkout page')).toBeTruthy();
  });

  it('keeps customers out of admin pages', () => {
    signIn('user');
    renderAt('/admin');
    expect(screen.getByText('admin login')).toBeTruthy();
  });

  it('sends guests from admin pages to the admin login', () => {
    renderAt('/admin');
    expect(screen.getByText('admin login')).toBeTruthy();
  });

  it('lets admins into admin pages', () => {
    signIn('admin');
    renderAt('/admin');
    expect(screen.getByText('admin dashboard')).toBeTruthy();
  });
});
