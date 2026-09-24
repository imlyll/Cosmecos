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
import { usePlaceOrder } from '../hooks/useOrders';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { sizedImage } from '../lib/api';
import { formatPrice } from '../lib/format';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STEPS = [
  { id: 'shipping', label: 'Shipping', fields: ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'] },
  { id: 'payment', label: 'Payment', fields: ['paymentMethod'] },
  { id: 'review', label: 'Review', fields: ['notes'] },
];

const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'Cash on delivery', text: 'Pay in cash or by card when your order arrives.', icon: Banknote },
  { value: 'card', label: 'Credit / debit card', text: 'Pay by card with the courier on delivery.', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', text: 'We’ll email you a secure PayPal payment link.', icon: Wallet },
];

const schema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name'),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(30),
  line1: z.string().trim().min(3, 'Enter your street address'),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, 'Enter your city'),
  state: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().min(2, 'Enter your postal code').max(20),
  country: z.string().trim().min(2, 'Enter your country'),
  paymentMethod: z.enum(['cash_on_delivery', 'card', 'paypal']),
  notes: z.string().trim().max(500).optional(),
});

function Stepper({ step, onJump }) {
  return (
    <ol className="flex items-center" aria-label="Checkout progress">
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
              <motion.span
                className="grid size-10 place-items-center border font-serif text-[13px] font-bold"
                animate={{
                  backgroundColor: done || active ? '#232323' : 'rgba(0,0,0,0)',
                  borderColor: done || active ? '#232323' : '#e0e0e0',
                  color: done || active ? '#ffffff' : '#737373',
                }}
                transition={{ duration: 0.4 }}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </motion.span>
              <span className={clsx('hidden font-serif text-[13px] font-bold tracking-[0.05em] uppercase sm:block', active ? 'text-ink' : 'text-taupe')}>
                {s.label}
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
  useDocumentTitle('Checkout');
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
        onError: (err) => toast.error(err.message),
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
      <PageHero title="Shop Checkout" image={HERO_IMAGES.beauty} />
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
                        Shipping address
                      </h2>
                      <p className="mt-2 text-taupe">Ordering as {user?.email}</p>
                      <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <Field label="Full name *" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
                        <Field label="Phone *" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
                        <Field
                          className="sm:col-span-2"
                          label="Street address *"
                          autoComplete="address-line1"
                          error={errors.line1?.message}
                          {...register('line1')}
                        />
                        <Field
                          className="sm:col-span-2"
                          label="Apartment, suite (optional)"
                          autoComplete="address-line2"
                          {...register('line2')}
                        />
                        <Field label="City *" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
                        <Field label="State / region" autoComplete="address-level1" {...register('state')} />
                        <Field label="Postal code *" autoComplete="postal-code" error={errors.postalCode?.message} {...register('postalCode')} />
                        <Field label="Country *" autoComplete="country-name" error={errors.country?.message} {...register('country')} />
                      </div>
                    </section>
                  )}

                  {step === 1 && (
                    <section aria-labelledby="pay-heading">
                      <h2 id="pay-heading" className="title-line text-[26px] leading-[38px] font-normal">
                        Delivery & payment
                      </h2>
                      <div className="mt-8 flex items-center gap-4 border border-ink bg-white p-5">
                        <Truck className="size-6 text-rose" strokeWidth={1.3} />
                        <div className="flex-1">
                          <p className="font-serif font-semibold text-ink">Standard delivery</p>
                          <p className="text-sm text-taupe">3–5 business days</p>
                        </div>
                        <p className="text-sm">{cart.shippingPrice === 0 ? 'Free' : formatPrice(cart.shippingPrice)}</p>
                      </div>

                      <fieldset className="mt-8">
                        <legend className="label-luxe">Payment method</legend>
                        <div className="space-y-3">
                          {PAYMENT_METHODS.map(({ value, label, text, icon: Icon }) => (
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
                                <span className="block font-serif font-semibold text-ink">{label}</span>
                                <span className="mt-0.5 block text-sm text-taupe">{text}</span>
                              </span>
                              <Icon className="size-6 text-taupe" strokeWidth={1.3} />
                            </label>
                          ))}
                        </div>
                        <p className="mt-4 text-xs text-taupe">
                          Online card processing isn’t connected yet — no card details are collected on this site.
                        </p>
                      </fieldset>
                    </section>
                  )}

                  {step === 2 && (
                    <section aria-labelledby="review-heading">
                      <h2 id="review-heading" className="title-line text-[26px] leading-[38px] font-normal">
                        Review your order
                      </h2>
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="border border-line p-5 text-sm">
                          <div className="flex justify-between">
                            <p className="label-luxe">Ship to</p>
                            <button type="button" onClick={() => setStep([0, -1])} className="link-underline text-xs">
                              Edit
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
                            <p className="label-luxe">Payment</p>
                            <button type="button" onClick={() => setStep([1, -1])} className="link-underline text-xs">
                              Edit
                            </button>
                          </div>
                          <p className="font-medium">{PAYMENT_METHODS.find((m) => m.value === values.paymentMethod)?.label}</p>
                          <p className="text-taupe">Standard delivery · 3–5 business days</p>
                        </div>
                      </div>

                      <ul className="mt-8 divide-y divide-line border-y border-line">
                        {cart.items.map((item) => (
                          <li key={item._id} className="flex items-center gap-4 py-4">
                            <img src={sizedImage(item.product.image, 160)} alt="" className="h-20 w-16 bg-beige object-cover" />
                            <div className="flex-1">
                              <p className="font-serif text-lg leading-tight text-ink">{item.product.name}</p>
                              <p className="text-xs text-taupe">
                                {item.variant ? `${item.variant.name} · ` : ''}Qty {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm">{formatPrice(item.subtotal)}</p>
                          </li>
                        ))}
                      </ul>

                      <Field className="mt-8" label="Order notes (optional)" as="textarea" rows={3} {...register('notes')} />
                    </section>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
              {step === 0 ? (
                <Link to="/cart" className="group flex items-center gap-2 font-serif text-[13px] font-bold text-ink uppercase">
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back to bag
                </Link>
              ) : (
                <button type="button" onClick={back} className="group flex items-center gap-2 font-serif text-[13px] font-bold text-ink uppercase">
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                // Distinct keys stop React from reusing this <button> as the submit button:
                // validation resolves in a microtask, before the click's default action runs.
                <Button key="next" type="button" size="lg" onClick={next}>
                  Continue to {STEPS[step + 1].label.toLowerCase()}
                </Button>
              ) : (
                <Button key="submit" type="submit" size="lg" loading={placeOrder.isPending}>
                  <Lock className="size-4" /> Place order
                </Button>
              )}
            </div>
          </form>

          <div className="lg:sticky lg:top-28">
            <OrderSummary cart={cart} title="Your order" />
          </div>
        </div>
      </div>
    </>
  );
}
