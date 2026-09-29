import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, KeyRound, LogOut, Package, UserRound } from 'lucide-react';
import clsx from 'clsx';
import PageHero from '../components/ui/PageHero';
import Button from '../components/ui/Button';
import Field, { applyServerErrors } from '../components/ui/Field';
import Pagination from '../components/ui/Pagination';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { useAuthStore } from '../store/auth';
import { useChangePassword, useLogout, useUpdateProfile } from '../hooks/useAuth';
import { useCancelOrder, useOrders } from '../hooks/useOrders';
import { sizedImage } from '../lib/api';
import { formatDate, formatPrice } from '../lib/format';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';

// Labels live in profile.tabs.<id>.
const TABS = [
  { id: 'orders', icon: Package },
  { id: 'details', icon: UserRound },
  { id: 'password', icon: KeyRound },
];

const STATUS_STYLES = {
  Pending: 'bg-nude text-ink',
  Processing: 'bg-sand/60 text-ink',
  Shipped: 'bg-blush/30 text-rose',
  Delivered: 'bg-success/15 text-success',
  Cancelled: 'bg-danger/10 text-danger',
};
const PROGRESS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

function StatusTimeline({ status }) {
  const { t } = useTranslation();
  if (status === 'Cancelled') return <p className="text-sm text-danger">{t('profile.cancelled')}</p>;
  const current = PROGRESS.indexOf(status);
  return (
    <ol className="flex items-center">
      {PROGRESS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <span className={clsx('size-3 rounded-full', i <= current ? 'bg-ink' : 'bg-line')} />
            <span className={clsx('text-[10px] tracking-[0.15em] uppercase', i <= current ? 'text-ink' : 'text-taupe')}>{t(`orderStatus.${s}`)}</span>
          </div>
          {i < PROGRESS.length - 1 && (
            <span className="relative mx-2 mb-6 h-px flex-1 bg-line">
              <motion.span
                className="absolute inset-y-0 left-0 bg-ink"
                initial={{ width: 0 }}
                animate={{ width: i < current ? '100%' : '0%' }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: EASE }}
              />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const cancel = useCancelOrder();
  const canCancel = ['Pending', 'Processing'].includes(order.status);

  return (
    <li className="border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-2 items-center gap-4 p-5 text-left sm:grid-cols-[1.3fr_1fr_1fr_auto_auto] sm:p-6"
      >
        <div>
          <p className="font-serif text-xs font-bold tracking-[0.05em] text-mute uppercase">{t('profile.order')}</p>
          <p className="font-medium tracking-wide">{order.orderNumber}</p>
        </div>
        <div>
          <p className="font-serif text-xs font-bold tracking-[0.05em] text-mute uppercase">{t('profile.placed')}</p>
          <p className="text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="font-serif text-xs font-bold tracking-[0.05em] text-mute uppercase">{t('profile.total')}</p>
          <p className="text-sm font-medium">{formatPrice(order.totalPrice)}</p>
        </div>
        <span className={clsx('justify-self-start px-3 py-1 text-[11px] tracking-wider sm:justify-self-auto', STATUS_STYLES[order.status])}>
          {t(`orderStatus.${order.status}`)}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="hidden sm:block">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-5 sm:p-6">
              <StatusTimeline status={order.status} />
              {order.trackingNumber && (
                <p className="mt-4 text-sm">
                  {t('profile.tracking')} <span className="font-medium">{order.trackingNumber}</span>
                </p>
              )}
              <ul className="mt-6 divide-y divide-line">
                {order.items.map((item) => (
                  <li key={`${item.product}-${item.variantId}`} className="flex items-center gap-4 py-3">
                    <img src={sizedImage(item.image, 120)} alt="" className="h-16 w-13 bg-beige object-cover" />
                    <div className="flex-1">
                      <p className="font-serif text-lg leading-tight">{item.name}</p>
                      <p className="text-xs text-taupe">
                        {item.variantName ? `${item.variantName} · ` : ''}
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm">{formatPrice(item.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-6 border-t border-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="label-luxe">{t('profile.shippingTo')}</p>
                  <p className="text-taupe">
                    {order.shippingAddress.fullName}, {order.shippingAddress.line1}, {order.shippingAddress.postalCode}{' '}
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>
                </div>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-taupe">{t('summary.subtotal')}</dt>
                    <dd>{formatPrice(order.itemsPrice)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-rose">
                      <dt>
                        {t('summary.discount')} ({order.couponCode})
                      </dt>
                      <dd>−{formatPrice(order.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-taupe">{t('summary.shipping')}</dt>
                    <dd>{order.shippingPrice ? formatPrice(order.shippingPrice) : t('summary.free')}</dd>
                  </div>
                  <div className="flex justify-between font-medium">
                    <dt>{t('summary.total')}</dt>
                    <dd>{formatPrice(order.totalPrice)}</dd>
                  </div>
                </dl>
              </div>
              {canCancel && (
                <div className="mt-6 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={cancel.isPending}
                    onClick={() => {
                      if (window.confirm(t('profile.cancelConfirm'))) cancel.mutate(order._id);
                    }}
                  >
                    {t('profile.cancelOrder')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function OrdersTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ page, limit: 5 });
  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!data?.orders.length) {
    return <EmptyState icon={Package} title={t('profile.noOrders')} text={t('profile.noOrdersText')} action={t('profile.startShopping')} to="/shop" />;
  }
  return (
    <>
      <ul className="space-y-4">
        {data.orders.map((o) => (
          <OrderCard key={o._id} order={o} />
        ))}
      </ul>
      <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
    </>
  );
}

const detailsSchema = z.object({
  name: z.string().trim().min(2, 'auth.errors.name'),
  phone: z.string().trim().max(30).optional(),
  address: z.object({
    line1: z.string().trim().max(120).optional(),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().max(60).optional(),
    state: z.string().trim().max(60).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(60).optional(),
  }),
});

function DetailsTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const a = user?.address || {};
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: { line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || '', country: a.country || '' },
    },
  });

  const onSubmit = (values) => update.mutate(values, { onError: (err) => applyServerErrors(err, setError) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('profile.fullName')} error={errors.name?.message && t(errors.name.message)} {...register('name')} />
        <Field label={t('profile.email')} value={user?.email || ''} disabled readOnly />
        <Field label={t('profile.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
      </div>
      <div>
        <h3 className="text-xl font-normal">{t('profile.defaultAddress')}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field className="sm:col-span-2" label={t('profile.street')} {...register('address.line1')} />
          <Field className="sm:col-span-2" label={t('profile.apartment')} {...register('address.line2')} />
          <Field label={t('profile.city')} {...register('address.city')} />
          <Field label={t('profile.state')} {...register('address.state')} />
          <Field label={t('profile.postalCode')} {...register('address.postalCode')} />
          <Field label={t('profile.country')} {...register('address.country')} />
        </div>
      </div>
      <Button type="submit" loading={update.isPending} disabled={!isDirty}>
        {t('common.saveChanges')}
      </Button>
    </form>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'profile.errors.currentPassword'),
    newPassword: z.string().min(8, 'auth.errors.min8').regex(/[A-Za-z]/, 'auth.errors.letter').regex(/\d/, 'auth.errors.number'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: 'auth.errors.mismatch', path: ['confirm'] });

function PasswordTab() {
  const { t } = useTranslation();
  const err = (e) => e?.message && t(e.message);
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = ({ confirm: _c, ...body }) =>
    change.mutate(body, {
      onSuccess: () => reset(),
      onError: (err) => {
        if (!applyServerErrors(err, setError)) setError('currentPassword', { message: err.message });
      },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5" noValidate>
      <Field label={t('profile.currentPassword')} type="password" autoComplete="current-password" error={err(errors.currentPassword)} {...register('currentPassword')} />
      <Field label={t('profile.newPassword')} type="password" autoComplete="new-password" error={err(errors.newPassword)} {...register('newPassword')} />
      <Field label={t('profile.confirmPassword')} type="password" autoComplete="new-password" error={err(errors.confirm)} {...register('confirm')} />
      <Button type="submit" loading={change.isPending}>
        {t('profile.updatePassword')}
      </Button>
    </form>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.myAccount'));
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('tab'))?.id || 'orders';

  return (
    <>
      <PageHero title={t('profile.title')} />
      <div className="container-luxe grid gap-12 py-[150px] max-md:py-20 lg:grid-cols-[270px_1fr] lg:gap-[70px]">
        <aside>
          <div className="flex items-center gap-4 border-b border-line pb-6">
            <span className="grid size-14 place-items-center rounded-full bg-blush font-script text-3xl text-ink">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-serif text-xl leading-tight text-ink">{user?.name}</p>
              <p className="truncate text-xs text-taupe">{user?.email}</p>
            </div>
          </div>
          <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto lg:flex-col" aria-label={t('a11y.accountNav')}>
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setParams(id === 'orders' ? {} : { tab: id })}
                aria-current={tab === id ? 'page' : undefined}
                className={clsx(
                  'relative flex shrink-0 items-center gap-3 border-b border-line px-4 py-4 font-serif text-sm font-semibold uppercase transition-colors',
                  tab === id ? 'text-white' : 'text-ink hover:text-rose'
                )}
              >
                {tab === id && <motion.span layoutId="account-tab" className="absolute inset-0 bg-ink" transition={{ duration: 0.4, ease: EASE }} />}
                <Icon className="relative size-4" strokeWidth={1.5} />
                <span className="relative">{t(`profile.tabs.${id}`)}</span>
              </button>
            ))}
            <Link to="/wishlist" className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-4 font-serif text-sm font-semibold text-ink uppercase hover:text-rose">
              <Heart className="size-4" strokeWidth={1.5} /> {t('profile.wishlist')}
            </Link>
            <button type="button" onClick={logout} className="flex shrink-0 items-center gap-3 px-4 py-4 font-serif text-sm font-semibold text-ink uppercase hover:text-danger">
              <LogOut className="size-4" strokeWidth={1.5} /> {t('profile.signOut')}
            </button>
          </nav>
        </aside>

        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <h2 className="title-line mb-8 text-[26px] leading-[38px] font-normal">{t(`profile.tabs.${tab}`)}</h2>
              {tab === 'orders' && <OrdersTab />}
              {tab === 'details' && <DetailsTab />}
              {tab === 'password' && <PasswordTab />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </>
  );
}
