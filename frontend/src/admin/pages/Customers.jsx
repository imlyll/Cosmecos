import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Pagination from '../../components/ui/Pagination';
import { ErrorState } from '../../components/ui/Feedback';
import { Badge, Card, EmptyRow, PageHeader, SearchInput, Select, SkeletonRows, Switch, Table, Td, Th } from '../ui';
import { useAdminUsers, useUpdateUser } from '../useAdmin';
import { useAuthStore } from '../../store/auth';
import { formatDate, formatPrice } from '../../lib/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function Customers() {
  const { t } = useTranslation();
  const tc = (key, opts) => t(`admin.customers.${key}`, opts);
  useDocumentTitle(t('admin.docTitle.customers'));
  const me = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const q = { search: params.get('search') || '', role: params.get('role') || '', page: Number(params.get('page') || 1) };
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsers({ ...q, limit: 15 });
  const update = useUpdateUser();
  const busy = (id) => update.isPending && update.variables?.id === id;

  return (
    <>
      <PageHeader
        title={tc('title')}
        subtitle={data ? tc('count', { count: data.pagination.total }) : t('admin.common.loading')}
      />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_200px]">
          <SearchInput value={q.search} onChange={(v) => set('search', v)} placeholder={tc('searchPlaceholder')} />
          <Select
            label={tc('role')}
            value={q.role}
            onChange={(v) => set('role', v)}
            options={[
              { value: '', label: tc('allRoles') },
              { value: 'user', label: tc('customersOption') },
              { value: 'admin', label: tc('adminsOption') },
            ]}
          />
        </div>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className={clsx('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
            <Table minWidth={820}>
              <thead>
                <tr>
                  <Th>{tc('col.name')}</Th>
                  <Th>{tc('col.joined')}</Th>
                  <Th className="text-right">{tc('col.orders')}</Th>
                  <Th className="text-right">{tc('col.spent')}</Th>
                  <Th>{tc('col.role')}</Th>
                  <Th>{tc('col.active')}</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={6} />
                ) : data.users.length === 0 ? (
                  <EmptyRow cols={6}>{tc('empty')}</EmptyRow>
                ) : (
                  data.users.map((u) => {
                    const self = u._id === me?._id;
                    return (
                      <tr key={u._id} className="hover:bg-cream">
                        <Td>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-beige font-serif text-lg">
                              {u.name[0]?.toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {u.name} {self && <span className="text-xs text-taupe">{tc('you')}</span>}
                              </p>
                              <p className="truncate text-xs text-taupe">{u.email}</p>
                            </div>
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap text-taupe">{formatDate(u.createdAt)}</Td>
                        <Td className="text-right">{u.orderCount}</Td>
                        <Td className="text-right">{formatPrice(u.totalSpent)}</Td>
                        <Td>
                          {self ? (
                            <Badge tone="Admin" />
                          ) : (
                            <select
                              aria-label={tc('roleFor', { name: u.name })}
                              value={u.role}
                              disabled={busy(u._id)}
                              onChange={(e) => update.mutate({ id: u._id, role: e.target.value })}
                              className="h-9 border border-line bg-white px-2 text-sm outline-none focus:border-ink"
                            >
                              <option value="user">{tc('customer')}</option>
                              <option value="admin">{tc('admin')}</option>
                            </select>
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Switch
                              label={tc(u.isActive ? 'disable' : 'enable', { name: u.name })}
                              checked={u.isActive}
                              disabled={self || busy(u._id)}
                              onChange={(isActive) => update.mutate({ id: u._id, isActive })}
                            />
                            {!u.isActive && <Badge tone="Disabled" />}
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
      {data?.pagination && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={(p) => set('page', p > 1 ? String(p) : '')} />}
    </>
  );
}
