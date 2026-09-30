import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Counter from '../../components/ui/Counter';
import { ErrorState } from '../../components/ui/Feedback';
import SalesChart from '../SalesChart';
import { Badge, Card, PageHeader, Table, Td, Th } from '../ui';
import { useAdminStats, ORDER_STATUSES } from '../useAdmin';
import { sizedImage } from '../../lib/api';
import { formatDate, formatPrice } from '../../lib/format';
import { EASE } from '../../lib/motion';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

function StatCard({ label, value, icon: Icon, prefix = '', decimals = 0, to, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
    >
      <Link to={to} className="group block border border-line bg-white p-4 transition-shadow hover:shadow-lg sm:p-6">
        <div className="flex items-start justify-between">
          <span className="grid size-9 place-items-center rounded-full bg-beige text-rose sm:size-11">
            <Icon className="size-5" strokeWidth={1.5} />
          </span>
          <ArrowUpRight className="size-4 text-taupe transition-transform group-hover:rotate-45" />
        </div>
        <p className="mt-4 font-serif text-3xl leading-none sm:mt-6 sm:text-4xl">
          {prefix}
          {value == null ? '—' : <Counter to={value} decimals={decimals} duration={1.4} />}
        </p>
        <p className="mt-2 text-[10px] tracking-[0.2em] text-taupe uppercase sm:text-[11px]">{label}</p>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.docTitle.dashboard'));
  const { data: stats, isLoading, isError, error, refetch } = useAdminStats();

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const cards = [
    { key: 'totalRevenue', value: stats?.revenue, icon: DollarSign, prefix: '$', decimals: 2, to: '/admin/orders' },
    { key: 'orders', value: stats?.orders, icon: ShoppingCart, to: '/admin/orders' },
    { key: 'products', value: stats?.products, icon: Package, to: '/admin/products' },
    { key: 'customers', value: stats?.customers, icon: Users, to: '/admin/customers' },
  ];
  const monthRevenue = (stats?.salesLast30Days || []).reduce((s, d) => s + d.revenue, 0);

  return (
    <>
      <PageHeader title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ key, ...c }, i) => (
          <StatCard key={key} label={t(`admin.dashboard.${key}`)} {...c} value={isLoading ? null : c.value} index={i} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={t('admin.dashboard.revenue30')}
          action={<span className="text-sm font-medium">{formatPrice(monthRevenue)}</span>}
        >
          <div className="p-5">{isLoading ? <div className="h-60 animate-pulse bg-beige" /> : <SalesChart data={stats.salesLast30Days} />}</div>
        </Card>

        <Card title={t('admin.dashboard.ordersByStatus')}>
          <ul className="divide-y divide-line">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <Link to={`/admin/orders?status=${s}`} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-cream">
                  <Badge tone={s} />
                  <span className="font-serif text-2xl">{stats?.ordersByStatus?.[s] ?? '—'}</span>
                </Link>
              </li>
            ))}
            <li className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-taupe">{t('admin.dashboard.averageOrder')}</span>
              <span className="font-medium">{stats ? formatPrice(stats.averageOrderValue) : '—'}</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={t('admin.dashboard.recentOrders')}
          action={
            <Link to="/admin/orders" className="link-underline text-xs text-taupe hover:text-ink">
              {t('admin.common.viewAll')}
            </Link>
          }
        >
          <Table minWidth={560}>
            <thead>
              <tr>
                <Th>{t('admin.dashboard.order')}</Th>
                <Th>{t('admin.dashboard.customer')}</Th>
                <Th>{t('admin.dashboard.date')}</Th>
                <Th>{t('admin.dashboard.status')}</Th>
                <Th className="text-right">{t('admin.dashboard.total')}</Th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).map((o) => (
                <tr key={o._id} className="hover:bg-cream">
                  <Td className="font-medium">{o.orderNumber}</Td>
                  <Td>{o.user?.name || '—'}</Td>
                  <Td className="text-taupe">{formatDate(o.createdAt)}</Td>
                  <Td>
                    <Badge tone={o.status} />
                  </Td>
                  <Td className="text-right">{formatPrice(o.totalPrice)}</Td>
                </tr>
              ))}
              {stats && !stats.recentOrders.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-taupe">
                    {t('admin.dashboard.noOrders')}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card title={t('admin.dashboard.lowStock')}>
            <ul className="divide-y divide-line">
              {(stats?.lowStock || []).map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link to={`/admin/products/${p._id}/edit`} className="truncate hover:text-rose">
                    {p.name}
                  </Link>
                  <span className={`flex shrink-0 items-center gap-1.5 ${p.stock === 0 ? 'text-danger' : 'text-ink'}`}>
                    {p.stock === 0 && <AlertTriangle className="size-3.5" />}
                    {p.stock === 0 ? t('admin.dashboard.outOfStock') : t('admin.dashboard.left', { count: p.stock })}
                  </span>
                </li>
              ))}
              {stats && !stats.lowStock.length && <li className="px-5 py-6 text-sm text-taupe">{t('admin.dashboard.wellStocked')}</li>}
            </ul>
          </Card>
          <Card title={t('admin.dashboard.topSellers')}>
            <ul className="divide-y divide-line">
              {(stats?.topProducts || []).map((p) => (
                <li key={p._id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <img src={sizedImage(p.images?.[0]?.url, 80)} alt="" className="size-10 bg-beige object-cover" />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-taupe">{t('admin.dashboard.sold', { count: p.sold })}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
