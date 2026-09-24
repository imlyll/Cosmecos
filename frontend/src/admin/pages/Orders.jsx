import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import clsx from 'clsx';
import { Check, Eye } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { ErrorState } from '../../components/ui/Feedback';
import { Badge, Card, EmptyRow, PageHeader, SearchInput, Select, SkeletonRows, Switch, Table, Td, Th } from '../ui';
import { ORDER_STATUSES, ORDER_TRANSITIONS, useAdminOrder, useAdminOrders, useUpdateOrderStatus, useUpdatePayment } from '../useAdmin';
import { sizedImage } from '../../lib/api';
import { formatDate, formatPrice } from '../../lib/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const PAYMENT_LABELS = { cash_on_delivery: 'Cash on delivery', card: 'Card', paypal: 'PayPal' };

function StatusControl({ order }) {
  const next = ORDER_TRANSITIONS[order.status];
  const [status, setStatus] = useState(next[0] || '');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const update = useUpdateOrderStatus();

  useEffect(() => {
    setStatus(ORDER_TRANSITIONS[order.status][0] || '');
    setNote('');
  }, [order.status]);

  if (!next.length) {
    return <p className="text-sm text-taupe">This order is {order.status.toLowerCase()} — no further status changes are possible.</p>;
  }

  const submit = (e) => {
    e.preventDefault();
    update.mutate({
      id: order._id,
      status,
      ...(note.trim() && { note: note.trim() }),
      ...(status === 'Shipped' && tracking.trim() && { trackingNumber: tracking.trim() }),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="label-luxe">Move to</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="New status">
          {next.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={clsx(
                'flex items-center gap-1.5 border px-4 py-2 text-sm transition-colors',
                status === s ? (s === 'Cancelled' ? 'border-danger bg-danger text-cream' : 'border-ink bg-ink text-cream') : 'border-line bg-white hover:border-ink'
              )}
            >
              {status === s && <Check className="size-3.5" />} {s}
            </button>
          ))}
        </div>
      </div>
      {status === 'Shipped' && (
        <label className="block">
          <span className="label-luxe">Tracking number</span>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="input-luxe" placeholder="e.g. 1Z999AA10123456784" />
        </label>
      )}
      <label className="block">
        <span className="label-luxe">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input-luxe" maxLength={300} placeholder="Visible in the order history" />
      </label>
      {status === 'Cancelled' && <p className="text-xs text-danger">Cancelling returns all items to stock and releases any coupon use.</p>}
      <Button type="submit" size="sm" loading={update.isPending} className="w-full">
        Update status to {status}
      </Button>
    </form>
  );
}

function OrderDrawer({ orderId, onClose }) {
  // Loaded by id (not from the list) so it stays open even if a status change moves it out of the current filter.
  const { data: order } = useAdminOrder(orderId);
  const payment = useUpdatePayment();
  return (
    <Drawer open={Boolean(orderId)} onClose={onClose} title={order ? order.orderNumber : 'Loading…'} className="max-w-xl">
      {order && (
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{order.status}</Badge>
            <Badge>{order.isPaid ? 'Paid' : 'Unpaid'}</Badge>
            <span className="text-sm text-taupe">Placed {formatDate(order.createdAt)}</span>
          </div>

          <section>
            <h3 className="label-luxe">Fulfilment</h3>
            <StatusControl order={order} />
          </section>

          <section className="flex items-center justify-between gap-4 border-y border-line py-4">
            <div>
              <p className="text-sm font-medium">Payment received</p>
              <p className="text-xs text-taupe">{PAYMENT_LABELS[order.paymentMethod]}</p>
            </div>
            <Switch
              label="Payment received"
              checked={order.isPaid}
              disabled={payment.isPending}
              onChange={(isPaid) => payment.mutate({ id: order._id, isPaid })}
            />
          </section>

          <section>
            <h3 className="label-luxe">Items</h3>
            <ul className="divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={`${item.product}-${item.variantId}`} className="flex items-center gap-3 py-3">
                  <img src={sizedImage(item.image, 120)} alt="" className="size-12 bg-beige object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-taupe">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm">{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-taupe">Subtotal</dt><dd>{formatPrice(order.itemsPrice)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose"><dt>Discount ({order.couponCode})</dt><dd>−{formatPrice(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-taupe">Shipping</dt><dd>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'Free'}</dd></div>
              <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(order.totalPrice)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <h3 className="label-luxe">Customer</h3>
              <p className="font-medium">{order.user?.name || 'Deleted user'}</p>
              <p className="text-taupe">{order.user?.email}</p>
            </div>
            <div>
              <h3 className="label-luxe">Ship to</h3>
              <p>{order.shippingAddress.fullName}</p>
              <p className="text-taupe">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}, {order.shippingAddress.country}
                <br />
                {order.shippingAddress.phone}
              </p>
            </div>
          </section>

          {order.notes && (
            <section>
              <h3 className="label-luxe">Customer note</h3>
              <p className="bg-beige p-3 text-sm">{order.notes}</p>
            </section>
          )}

          <section>
            <h3 className="label-luxe">History</h3>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-ink" />
                  <p className="font-medium">{h.status}</p>
                  <p className="text-xs text-taupe">{new Date(h.changedAt).toLocaleString()}</p>
                  {h.note && <p className="mt-1 text-taupe">{h.note}</p>}
                </li>
              ))}
            </ol>
            {order.trackingNumber && <p className="mt-4 text-sm">Tracking: <span className="font-medium">{order.trackingNumber}</span></p>}
          </section>
        </div>
      )}
    </Drawer>
  );
}

export default function Orders() {
  useDocumentTitle('Orders · Admin');
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState(null);
  const q = {
    status: params.get('status') || '',
    search: params.get('search') || '',
    page: Number(params.get('page') || 1),
  };
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminOrders({ ...q, limit: 12 });

  return (
    <>
      <PageHeader title="Orders" subtitle={data ? `${data.pagination.total} order${data.pagination.total === 1 ? '' : 's'}` : 'Loading…'} />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {['', ...ORDER_STATUSES].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            role="tab"
            aria-selected={q.status === s}
            onClick={() => set('status', s)}
            className={clsx(
              'border px-4 py-2 text-xs tracking-[0.12em] uppercase transition-colors',
              q.status === s ? 'border-ink bg-ink text-cream' : 'border-line bg-white hover:border-ink'
            )}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_200px]">
          <SearchInput value={q.search} onChange={(v) => set('search', v)} placeholder="Search by order number…" />
          <Select
            label="Status"
            value={q.status}
            onChange={(v) => set('status', v)}
            options={[{ value: '', label: 'All statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className={clsx('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
            <Table minWidth={860}>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Items</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Manage</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={8} />
                ) : data.orders.length === 0 ? (
                  <EmptyRow cols={8}>No orders found.</EmptyRow>
                ) : (
                  data.orders.map((o) => (
                    <tr key={o._id} className="cursor-pointer transition-colors hover:bg-cream" onClick={() => setOpenId(o._id)}>
                      <Td className="font-medium whitespace-nowrap">{o.orderNumber}</Td>
                      <Td>
                        <p>{o.user?.name || '—'}</p>
                        <p className="text-xs text-taupe">{o.user?.email}</p>
                      </Td>
                      <Td className="whitespace-nowrap text-taupe">{formatDate(o.createdAt)}</Td>
                      <Td className="text-right">{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                      <Td className="text-right font-medium">{formatPrice(o.totalPrice)}</Td>
                      <Td>
                        <Badge>{o.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                      </Td>
                      <Td>
                        <Badge>{o.status}</Badge>
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(o._id);
                          }}
                          className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs hover:border-ink"
                        >
                          <Eye className="size-3.5" /> Manage
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={(p) => set('page', p > 1 ? String(p) : '')} />}

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
