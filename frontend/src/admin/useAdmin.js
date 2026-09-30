import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import i18n from '../i18n';

// Mirrors the API's allowed order status moves (backend admin.controller TRANSITIONS).
export const ORDER_TRANSITIONS = {
  Pending: ['Processing', 'Shipped', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};
export const ORDER_STATUSES = Object.keys(ORDER_TRANSITIONS);

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api('/admin/stats'), select: (d) => d.stats });

export const useAdminProducts = (params) =>
  useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: ({ signal }) => api('/products', { params, signal }),
    placeholderData: keepPreviousData,
  });

export const useAdminProduct = (id) =>
  useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api(`/products/${id}`),
    select: (d) => d.product,
    enabled: Boolean(id),
  });

export const useAdminOrders = (params) =>
  useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: ({ signal }) => api('/admin/orders', { params, signal }),
    placeholderData: keepPreviousData,
  });

// Admins can read any order through the regular order endpoint.
export const useAdminOrder = (id) =>
  useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api(`/orders/${id}`),
    select: (d) => d.order,
    enabled: Boolean(id),
  });

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: ({ signal }) => api('/admin/users', { params, signal }),
    placeholderData: keepPreviousData,
  });

/** Mutation that toasts, and refreshes admin + storefront caches on success. */
function useAdminMutation(mutationFn, successMessage) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['product-filters'] });
      const msg = typeof successMessage === 'function' ? successMessage(data, vars) : successMessage;
      if (msg) toast.success(msg);
    },
    onError: (err) => toast.error(err.message),
  });
}

/** Create (no id) or update a product; `body` is FormData so images upload in the same request. */
export const useSaveProduct = () =>
  useAdminMutation(
    ({ id, body, onUploadProgress }) =>
      api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body, onUploadProgress }),
    (_d, { id }) => i18n.t(id ? 'admin.toast.productUpdated' : 'admin.toast.productCreated')
  );

export const useToggleProductActive = () =>
  useAdminMutation(
    ({ product }) => api(`/products/${product._id}`, { method: 'PUT', body: { isActive: !product.isActive } }),
    (_d, { product }) => i18n.t(product.isActive ? 'admin.toast.nowHidden' : 'admin.toast.nowVisible', { name: product.name })
  );

export const useDeleteProduct = () =>
  useAdminMutation(
    ({ id }) => api(`/products/${id}`, { method: 'DELETE' }),
    (_d, { name }) => i18n.t('admin.toast.deleted', { name })
  );

export const useUpdateOrderStatus = () =>
  useAdminMutation(
    ({ id, ...body }) => api(`/admin/orders/${id}/status`, { method: 'PATCH', body }),
    (d) => i18n.t('admin.toast.orderStatus', { number: d.order.orderNumber, status: i18n.t(`orderStatus.${d.order.status}`) })
  );

export const useUpdatePayment = () =>
  useAdminMutation(
    ({ id, isPaid }) => api(`/admin/orders/${id}/payment`, { method: 'PATCH', body: { isPaid } }),
    (d) => i18n.t(d.order.isPaid ? 'admin.toast.orderPaid' : 'admin.toast.orderUnpaid', { number: d.order.orderNumber })
  );

export const useUpdateUser = () =>
  useAdminMutation(
    ({ id, ...body }) => api(`/admin/users/${id}`, { method: 'PATCH', body }),
    (d) => i18n.t('admin.toast.userUpdated', { name: d.user.name })
  );
