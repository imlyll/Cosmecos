import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Banknote, Check, CreditCard, Lock, Truck, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import Field from '../components/ui/Field';
import PageHero, { HERO_IMAGES } from '../components/ui/PageHero';
import Button from '../components/ui/Button';
import OrderSummary from '../components/product/OrderSummary';
import { Skeleton } from '../components/ui/Feedback';
import { useCart } from '../hooks/useCart';
import { useTranslation } from 'react-i18next';
import { usePlaceOrder } from '../hooks/useOrders';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { sizedImage } from '../lib/api';
import { formatPrice } from '../lib/format';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Step and payment labels live in checkout.steps.<id> and checkout.methods.<value>.
const STEPS = [
  { id: 'shipping', fields: ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'] },
  { id: 'payment', fields: ['paymentMethod'] },
  { id: 'review', fields: ['notes'] },
];

const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', icon: Banknote },
  { value: 'card', icon: CreditCard },
  { value: 'paypal', icon: Wallet },
];

// Messages are translation keys, resolved when rendered.
const schema = z.object({
  fullName: z.string().trim().min(2, 'checkout.errors.fullName'),
  phone: z.string().trim().min(5, 'checkout.errors.phone').max(30),
  line1: z.string().trim().min(3, 'checkout.errors.street'),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, 'checkout.errors.city'),
  state: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().min(2, 'checkout.errors.postalCode').max(20),
  country: z.string().trim().min(2, 'checkout.errors.country'),
  paymentMethod: z.enum(['cash_on_delivery', 'card', 'paypal']),
  notes: z.string().trim().max(500).optional(),
});

function Stepper({ step, onJump }) {
  const { t } = useTranslation();
  return (
    <ol className="flex items-center" aria-label={t('a11y.checkoutProgress')}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s.id} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => done && onJump(i)}
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              className="flex items-center gap-3 disabled:cursor-default"
            >
              <span
                className={clsx(
                  'grid size-10 place-items-center border font-serif text-[13px] font-bold transition-colors duration-400',
                  done || active ? 'border-ink bg-ink text-white' : 'border-line bg-transparent text-taupe'
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={clsx('hidden font-serif text-[13px] font-bold tracking-[0.05em] uppercase sm:block', active ? 'text-ink' : 'text-taupe')}>
                {t(`checkout.steps.${s.id}`)}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="relative mx-3 h-px flex-1 bg-line sm:mx-5">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-ink"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.checkout'));
  const [[step, dir], setStep] = useState([0, 1]);
  const { cart, isLoading } = useCart();
  const user = useAuthStore((s) => s.user);
  const { couponCode, setCouponCode } = useUIStore();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const a = user?.address || {};
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fullName: a.fullName || user?.name || '',
      phone: a.phone || user?.phone || '',
      line1: a.line1 || '',
      line2: a.line2 || '',
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || '',
      paymentMethod: 'cash_on_delivery',
      notes: '',
    },
  });
  const paymentMethod = watch('paymentMethod');
  const err = (e) => e?.message && t(e.message);

  if (isLoading) {
    return (
      <div className="container-luxe grid gap-12 py-16 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }
  if (!cart.items.length && !placeOrder.isSuccess) return <Navigate to="/cart" replace />;

  const next = async () => {
    const valid = await trigger(STEPS[step].fields);
    if (valid) {
      setStep([step + 1, 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const back = () => setStep([step - 1, -1]);

  const onSubmit = ({ paymentMethod: method, notes, ...address }) => {
    const shippingAddress = Object.fromEntries(Object.entries(address).filter(([, v]) => v !== ''));
    placeOrder.mutate(
      { shippingAddress, paymentMethod: method, ...(notes && { notes }), ...(couponCode && { couponCode }) },
      {
        onSuccess: ({ order }) => {
          setCouponCode('');
          navigate(`/order-success/${order._id}`, { replace: true });
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const values = getValues();
  const panel = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <>
      <PageHero title={t('checkout.title')} image={HERO_IMAGES.beauty} />
      <div className="container-luxe py-[150px] max-md:py-20">

        <div className="grid items-start gap-12 lg:grid-cols-[1fr_420px] xl:gap-16">
          <form
            onSubmit={(e) => {
              // Enter on an earlier step advances instead of placing the order.
              if (step < STEPS.length - 1) {
                e.preventDefault();
                next();
                return;
              }
              handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <Stepper step={step} onJump={(i) => setStep([i, -1])} />

            <div className="relative mt-10 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={panel}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {step === 0 && (
                    <section aria-labelledby="ship-heading">
                      <h2 id="ship-heading" className="title-line text-[26px] leading-[38px] font-normal">
                        {t('checkout.shippingAddress')}
                      </h2>
                      <p className="mt-2 text-taupe">{t('checkout.orderingAs', { email: user?.email })}</p>
                      <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <Field label={t('checkout.fullName')} autoComplete="name" error={err(errors.fullName)} {...register('fullName')} />
                        <Field label={t('checkout.phone')} type="tel" autoComplete="tel" error={err(errors.phone)} {...register('phone')} />
                        <Field
                          className="sm:col-span-2"
                          label={t('checkout.street')}
                          autoComplete="address-line1"
                          error={err(errors.line1)}
                          {...register('line1')}
                        />
                        <Field
                          className="sm:col-span-2"
                          label={t('checkout.apartment')}
                          autoComplete="address-line2"
                          {...register('line2')}
                        />
                        <Field label={t('checkout.city')} autoComplete="address-level2" error={err(errors.city)} {...register('city')} />
                        <Field label={t('checkout.state')} autoComplete="address-level1" {...register('state')} />
                        <Field label={t('checkout.postalCode')} autoComplete="postal-code" error={err(errors.postalCode)} {...register('postalCode')} />
                        <Field label={t('checkout.country')} autoComplete="country-name" error={err(errors.country)} {...register('country')} />
                      </div>
                    </section>
                  )}

                  {step === 1 && (
                    <section aria-labelledby="pay-heading">
                      <h2 id="pay-heading" className="title-line text-[26px] leading-[38px] font-normal">
                        {t('checkout.deliveryPayment')}
                      </h2>
                      <div className="mt-8 flex items-center gap-4 border border-ink bg-white p-5">
                        <Truck className="size-6 text-rose" strokeWidth={1.3} />
                        <div className="flex-1">
                          <p className="font-serif font-semibold text-ink">{t('checkout.standardDelivery')}</p>
                          <p className="text-sm text-taupe">{t('checkout.deliveryTime')}</p>
                        </div>
                        <p className="text-sm">{cart.shippingPrice === 0 ? t('summary.free') : formatPrice(cart.shippingPrice)}</p>
                      </div>

                      <fieldset className="mt-8">
                        <legend className="label-luxe">{t('checkout.paymentMethod')}</legend>
                        <div className="space-y-3">
                          {PAYMENT_METHODS.map(({ value, icon: Icon }) => (
                            <label
                              key={value}
                              className={clsx(
                                'flex cursor-pointer items-start gap-4 border p-5 transition-colors duration-300',
                                paymentMethod === value ? 'border-ink' : 'border-line hover:border-taupe'
                              )}
                            >
                              <input type="radio" value={value} className="sr-only" {...register('paymentMethod')} />
                              <span className={clsx('mt-0.5 grid size-5 place-items-center rounded-full border', paymentMethod === value ? 'border-ink' : 'border-line')}>
                                {paymentMethod === value && <motion.span layoutId="pay-dot" className="size-2.5 rounded-full bg-ink" />}
                              </span>
                              <span className="flex-1">
                                <span className="block font-serif font-semibold text-ink">{t(`checkout.methods.${value}.label`)}</span>
                                <span className="mt-0.5 block text-sm text-taupe">{t(`checkout.methods.${value}.text`)}</span>
                              </span>
                              <Icon className="size-6 text-taupe" strokeWidth={1.3} />
                            </label>
                          ))}
                        </div>
                        <p className="mt-4 text-xs text-taupe">
                          {t('checkout.cardNote')}
                        </p>
                      </fieldset>
                    </section>
                  )}

                  {step === 2 && (
                    <section aria-labelledby="review-heading">
                      <h2 id="review-heading" className="title-line text-[26px] leading-[38px] font-normal">
                        {t('checkout.reviewOrder')}
                      </h2>
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="border border-line p-5 text-sm">
                          <div className="flex justify-between">
                            <p className="label-luxe">{t('checkout.shipTo')}</p>
                            <button type="button" onClick={() => setStep([0, -1])} className="link-underline text-xs">
                              {t('common.edit')}
                            </button>
                          </div>
                          <p className="font-medium">{values.fullName}</p>
                          <p className="text-taupe">
                            {values.line1}
                            {values.line2 && `, ${values.line2}`}
                            <br />
                            {values.postalCode} {values.city}
                            {values.state && `, ${values.state}`}
                            <br />
                            {values.country} · {values.phone}
                          </p>
                        </div>
                        <div className="border border-line p-5 text-sm">
                          <div className="flex justify-between">
                            <p className="label-luxe">{t('checkout.payment')}</p>
                            <button type="button" onClick={() => setStep([1, -1])} className="link-underline text-xs">
                              {t('common.edit')}
                            </button>
                          </div>
                          <p className="font-medium">{t(`checkout.methods.${values.paymentMethod}.label`)}</p>
                          <p className="text-taupe">{t('checkout.deliverySummary')}</p>
                        </div>
                      </div>

                      <ul className="mt-8 divide-y divide-line border-y border-line">
                        {cart.items.map((item) => (
                          <li key={item._id} className="flex items-center gap-4 py-4">
                            <img src={sizedImage(item.product.image, 160)} alt="" className="h-20 w-16 bg-beige object-cover" />
                            <div className="flex-1">
                              <p className="font-serif text-lg leading-tight text-ink">{item.product.name}</p>
                              <p className="text-xs text-taupe">
                                {item.variant ? `${item.variant.name} · ` : ''}
                                {t('common.qty', { count: item.quantity })}
                              </p>
                            </div>
                            <p className="text-sm">{formatPrice(item.subtotal)}</p>
                          </li>
                        ))}
                      </ul>

                      <Field className="mt-8" label={t('checkout.notes')} as="textarea" rows={3} {...register('notes')} />
                    </section>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
              {step === 0 ? (
                <Link to="/cart" className="group flex items-center gap-2 font-serif text-[13px] font-bold text-ink uppercase">
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> {t('checkout.backToBag')}
                </Link>
              ) : (
                <button type="button" onClick={back} className="group flex items-center gap-2 font-serif text-[13px] font-bold text-ink uppercase">
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> {t('common.back')}
                </button>
              )}
              {step < STEPS.length - 1 ? (
                // Distinct keys stop React from reusing this <button> as the submit button:
                // validation resolves in a microtask, before the click's default action runs.
                <Button key="next" type="button" size="lg" onClick={next}>
                  {t('checkout.continueTo', { step: t(`checkout.steps.${STEPS[step + 1].id}`).toLowerCase() })}
                </Button>
              ) : (
                <Button key="submit" type="submit" size="lg" loading={placeOrder.isPending}>
                  <Lock className="size-4" /> {t('common.placeOrder')}
                </Button>
              )}
            </div>
            {step === STEPS.length - 1 && <p className="mt-6 text-xs leading-relaxed text-taupe">{t('checkout.policy')}</p>}
          </form>

          <div className="lg:sticky lg:top-28">
            <OrderSummary cart={cart} title={t('summary.yourOrder')} />
          </div>
        </div>
      </div>
    </>
  );
}
