import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import i18n, { errorMessage } from '../i18n';

const EMPTY_CART = { items: [], itemCount: 0, itemsPrice: 0, shippingPrice: 0, totalPrice: 0, discount: 0 };

export function useCart() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ['cart', token],
    queryFn: () => api('/cart'),
    select: (d) => d.cart,
    enabled: Boolean(token),
  });
  return { ...query, cart: token ? query.data || EMPTY_CART : EMPTY_CART };
}

function useCartMutation(mutationFn, { onSuccessMessage } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      // Token is read at call time: the action may have been queued before sign-in.
      qc.setQueryData(['cart', useAuthStore.getState().token], data);
      const msg = typeof onSuccessMessage === 'function' ? onSuccessMessage(vars) : onSuccessMessage;
      if (msg) toast.success(msg);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useAddToCart({ openDrawer = true } = {}) {
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const mutation = useCartMutation(
    ({ productId, variantId, quantity = 1 }) =>
      api('/cart/items', { method: 'POST', body: { productId, variantId, quantity } }),
    { onSuccessMessage: (vars) => (vars.name ? i18n.t('toast.addedToBag', { name: vars.name }) : i18n.t('toast.addedToBagGeneric')) }
  );
  return {
    ...mutation,
    mutate: (vars, opts) =>
      mutation.mutate(vars, {
        ...opts,
        onSuccess: (...args) => {
          if (openDrawer) setCartOpen(true);
          opts?.onSuccess?.(...args);
        },
      }),
  };
}

export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }) => api(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } }));

export const useRemoveCartItem = () =>
  useCartMutation(({ itemId }) => api(`/cart/items/${itemId}`, { method: 'DELETE' }), {
    onSuccessMessage: () => i18n.t('toast.removedFromBag'),
  });

export const useClearCart = () => useCartMutation(() => api('/cart', { method: 'DELETE' }));
