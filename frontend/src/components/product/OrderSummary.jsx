import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tag, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUIStore } from '../../store/ui';
import { useCouponTotals } from '../../hooks/useCoupon';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import FreeShippingBar from './FreeShippingBar';

function CouponInput() {
  const { couponCode, setCouponCode } = useUIStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const apply = async (e) => {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const data = await api('/coupons/validate', { method: 'POST', body: { code } });
      qc.setQueryData(['coupon', code, data.totals.itemsPrice], data);
      setCouponCode(code);
      setValue('');
      toast.success(`Coupon ${code} applied`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (couponCode) {
    return (
      <div className="flex items-center justify-between border border-dashed border-rose bg-nude px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Tag className="size-4 text-rose" /> <strong className="font-serif font-bold tracking-wider text-ink">{couponCode}</strong>
        </span>
        <button type="button" onClick={() => setCouponCode('')} aria-label="Remove coupon" className="p-1 text-taupe hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply}>
      <label htmlFor="coupon" className="label-luxe">
        Coupon code
      </label>
      <div className="flex gap-2.5">
        <input
          id="coupon"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Coupon code"
          aria-invalid={error ? 'true' : undefined}
          className="input-luxe uppercase placeholder:normal-case"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="btn-cos shrink-0 px-6"
        >
          {loading ? '…' : 'Apply coupon'}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p className="mt-2 text-xs text-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

/** Totals panel shared by cart and checkout; coupon discounts come from the server. */
export default function OrderSummary({ cart, children, showCoupon = true, title = 'Cart totals' }) {
  const { totals: couponTotals, error: couponError, coupon } = useCouponTotals(cart.itemsPrice);
  const setCouponCode = useUIStore((s) => s.setCouponCode);
  const totals = couponTotals || cart;

  // A coupon that stops qualifying (e.g. subtotal dropped) is removed with a notice.
  useEffect(() => {
    if (!couponError) return;
    toast.error(couponError.message);
    setCouponCode('');
  }, [couponError, setCouponCode]);

  const rows = [
    { label: 'Subtotal', value: formatPrice(totals.itemsPrice) },
    totals.discount > 0 && { label: `Discount${coupon ? ` (${coupon.code})` : ''}`, value: `−${formatPrice(totals.discount)}`, accent: true },
    { label: 'Shipping', value: totals.shippingPrice === 0 ? 'Free' : formatPrice(totals.shippingPrice) },
    totals.taxPrice > 0 && { label: 'Tax', value: formatPrice(totals.taxPrice) },
  ].filter(Boolean);

  return (
    <div className="border border-line p-6 sm:p-[40px]">
      <h2 className="title-line text-[26px] leading-[38px] font-normal">{title}</h2>
      <div className="mt-6">
        <FreeShippingBar remaining={cart.amountToFreeShipping} threshold={cart.freeShippingThreshold} />
      </div>
      {showCoupon && (
        <div className="mt-6">
          <CouponInput />
        </div>
      )}
      <dl className="mt-6 border-t border-line">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div
              key={r.label}
              layout
              className="flex justify-between border-b border-line py-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <dt className="font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase">{r.label}</dt>
              <dd className={r.accent ? 'text-rose' : 'text-taupe'}>{r.value}</dd>
            </motion.div>
          ))}
        </AnimatePresence>
      </dl>
      <div className="flex items-baseline justify-between py-4">
        <span className="font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase">Total</span>
        <motion.span key={totals.totalPrice} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-sans text-xl font-bold text-rose">
          {formatPrice(totals.totalPrice)}
        </motion.span>
      </div>
      {children}
    </div>
  );
}
