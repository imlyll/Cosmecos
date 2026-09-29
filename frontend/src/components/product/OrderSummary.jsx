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
import { useTranslation } from 'react-i18next';

function CouponInput() {
  const { t } = useTranslation();
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
      toast.success(t('toast.couponApplied', { code }));
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
        <button type="button" onClick={() => setCouponCode('')} aria-label={t('summary.removeCoupon')} className="p-1 text-taupe hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply}>
      <label htmlFor="coupon" className="label-luxe">
        {t('summary.couponCode')}
      </label>
      <div className="flex gap-2.5">
        <input
          id="coupon"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('summary.couponCode')}
          aria-invalid={error ? 'true' : undefined}
          className="input-luxe uppercase placeholder:normal-case"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="btn-cos shrink-0 px-6"
        >
          {loading ? '…' : t('summary.applyCoupon')}
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
export default function OrderSummary({ cart, children, showCoupon = true, title }) {
  const { t } = useTranslation();
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
    { key: 'subtotal', label: t('summary.subtotal'), value: formatPrice(totals.itemsPrice) },
    totals.discount > 0 && { key: 'discount', label: `${t('summary.discount')}${coupon ? ` (${coupon.code})` : ''}`, value: `−${formatPrice(totals.discount)}`, accent: true },
    { key: 'shipping', label: t('summary.shipping'), value: totals.shippingPrice === 0 ? t('summary.free') : formatPrice(totals.shippingPrice) },
    totals.taxPrice > 0 && { key: 'tax', label: t('summary.tax'), value: formatPrice(totals.taxPrice) },
  ].filter(Boolean);

  return (
    <div className="border border-line p-6 sm:p-[40px]">
      <h2 className="title-line text-[26px] leading-[38px] font-normal">{title || t('summary.cartTotals')}</h2>
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
              key={r.key}
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
        <span className="font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase">{t('summary.total')}</span>
        <motion.span key={totals.totalPrice} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-sans text-xl font-bold text-rose">
          {formatPrice(totals.totalPrice)}
        </motion.span>
      </div>
      {children}
    </div>
  );
}
