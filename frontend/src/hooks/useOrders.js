import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n, { errorMessage } from '../i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export function useOrders(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => api('/orders', { params }),
    enabled: Boolean(token),
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api(`/orders/${id}`),
    select: (d) => d.order,
    enabled: Boolean(id),
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api('/orders', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/orders/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success(i18n.t('toast.orderCancelled'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (code) => api('/coupons/validate', { method: 'POST', body: { code } }),
  });
}
