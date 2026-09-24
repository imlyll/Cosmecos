import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

function useAuthMutation(path, successMessage) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api(path, { method: 'POST', body }),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
      qc.invalidateQueries();
      toast.success(successMessage(data.user));
    },
  });
}

export const useLogin = () => useAuthMutation('/auth/login', (u) => `Welcome back, ${u.name.split(' ')[0]}`);
export const useRegister = () =>
  useAuthMutation('/auth/register', (u) => `Welcome to Cosmecos, ${u.name.split(' ')[0]}`);

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return () => {
    logout();
    qc.removeQueries({ queryKey: ['cart'] });
    qc.removeQueries({ queryKey: ['wishlist'] });
    qc.removeQueries({ queryKey: ['orders'] });
    toast('You have been signed out');
  };
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (body) => api('/auth/me', { method: 'PATCH', body }),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success('Profile updated');
    },
  });
}

export function useChangePassword() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (body) => api('/auth/me/password', { method: 'PATCH', body }),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
      toast.success('Password changed');
    },
  });
}
