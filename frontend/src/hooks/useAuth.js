import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import i18n from '../i18n';

const firstName = (user) => user.name.split(' ')[0];
// Emails from the API (verification codes) are written in the shopper's current language.
const withLang = (body) => ({ ...body, lang: i18n.resolvedLanguage || i18n.language });

/** POSTs to an endpoint that answers with { token, user } and starts the session. */
function useAuthMutation(path, successKey, { sendLang = false } = {}) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api(path, { method: 'POST', body: sendLang ? withLang(body) : body }),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
      qc.invalidateQueries();
      toast.success(i18n.t(successKey, { name: firstName(data.user) }));
    },
  });
}

/** Login. An unverified account rejects with code EMAIL_NOT_VERIFIED and a fresh code is emailed. */
export const useLogin = () => useAuthMutation('/auth/login', 'toast.welcomeBack', { sendLang: true });

/** Creates an unverified account and emails a code. Resolves to { email, resendAvailableIn, expiresInMinutes }. */
export function useRegister() {
  return useMutation({
    mutationFn: (body) => api('/auth/register', { method: 'POST', body: withLang(body) }),
    onSuccess: (data) => toast.success(i18n.t('toast.codeSent', { email: data.email })),
  });
}

/** Confirms the emailed code; on success the user is signed in. */
export const useVerifyOtp = () => useAuthMutation('/auth/verify-otp', 'toast.verified');

export function useResendOtp() {
  return useMutation({
    mutationFn: ({ email }) => api('/auth/resend-otp', { method: 'POST', body: withLang({ email }) }),
    onSuccess: () => toast.success(i18n.t('toast.codeResent')),
  });
}

/** Asks for a password reset code. The API answers the same whether or not the email is registered. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }) => api('/auth/forgot-password', { method: 'POST', body: withLang({ email }) }),
  });
}

/** Sets a new password with the emailed code; on success the user is signed in. */
export const useResetPassword = () => useAuthMutation('/auth/reset-password', 'toast.passwordReset');

/** Signs in (or up) with the ID token from Google Identity Services: { credential }. */
export const useGoogleLogin = () => useAuthMutation('/auth/google', 'toast.welcome');

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return () => {
    logout();
    qc.removeQueries({ queryKey: ['cart'] });
    qc.removeQueries({ queryKey: ['wishlist'] });
    qc.removeQueries({ queryKey: ['orders'] });
    toast(i18n.t('toast.signedOut'));
  };
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (body) => api('/auth/me', { method: 'PATCH', body }),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(i18n.t('toast.profileUpdated'));
    },
  });
}

export function useChangePassword() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (body) => api('/auth/me/password', { method: 'PATCH', body }),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
      toast.success(i18n.t('toast.passwordChanged'));
    },
  });
}
