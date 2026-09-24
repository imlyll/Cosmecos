import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUIStore } from '../store/ui';

/**
 * Validates the applied coupon against the current cart on the server and
 * returns discounted totals. Re-checks automatically when the subtotal changes.
 */
export function useCouponTotals(itemsPrice) {
  const code = useUIStore((s) => s.couponCode);
  const query = useQuery({
    queryKey: ['coupon', code, itemsPrice],
    queryFn: () => api('/coupons/validate', { method: 'POST', body: { code } }),
    enabled: Boolean(code) && itemsPrice > 0,
    retry: false,
    staleTime: 60_000,
  });
  return {
    code,
    coupon: query.data?.coupon,
    totals: query.data?.totals,
    error: query.error,
    isChecking: query.isFetching,
  };
}
