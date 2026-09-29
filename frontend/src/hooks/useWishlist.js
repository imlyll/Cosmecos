import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import i18n, { errorMessage } from '../i18n';

export function useWishlist() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ['wishlist', token],
    queryFn: () => api('/wishlist'),
    enabled: Boolean(token),
  });
  const products = token ? query.data?.products || [] : [];
  const ids = new Set(products.map((p) => p._id));
  return { ...query, products, count: products.length, has: (id) => ids.has(id) };
}

/** Toggles a product with an optimistic update so the heart reacts instantly. */
export function useToggleWishlist() {
  const qc = useQueryClient();
  // Token is read at call time: the toggle may have been queued before sign-in.
  const key = () => ['wishlist', useAuthStore.getState().token];

  return useMutation({
    mutationFn: ({ product }) => api('/wishlist/toggle', { method: 'POST', body: { productId: product._id } }),
    onMutate: async ({ product }) => {
      await qc.cancelQueries({ queryKey: key() });
      const previous = qc.getQueryData(key());
      const list = previous?.products || [];
      const exists = list.some((p) => p._id === product._id);
      const products = exists ? list.filter((p) => p._id !== product._id) : [product, ...list];
      qc.setQueryData(key(), { ...previous, products, count: products.length });
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      qc.setQueryData(key(), ctx?.previous);
      toast.error(errorMessage(err));
    },
    onSuccess: (data, { product, silent }) => {
      qc.setQueryData(key(), data);
      if (!silent) toast.success(data.added ? i18n.t('toast.savedToWishlist', { name: product.name }) : i18n.t('toast.removedFromWishlist'));
    },
  });
}
