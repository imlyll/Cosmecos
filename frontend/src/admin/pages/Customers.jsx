import { useSearchParams } from 'react-router';
import clsx from 'clsx';
import Pagination from '../../components/ui/Pagination';
import { ErrorState } from '../../components/ui/Feedback';
import { Badge, Card, EmptyRow, PageHeader, SearchInput, Select, SkeletonRows, Switch, Table, Td, Th } from '../ui';
import { useAdminUsers, useUpdateUser } from '../useAdmin';
import { useAuthStore } from '../../store/auth';
import { formatDate, formatPrice } from '../../lib/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function Customers() {
  useDocumentTitle('Customers · Admin');
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
      <PageHeader title="Customers" subtitle={data ? `${data.pagination.total} account${data.pagination.total === 1 ? '' : 's'}` : 'Loading…'} />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_200px]">
          <SearchInput value={q.search} onChange={(v) => set('search', v)} placeholder="Search name or email…" />
          <Select
            label="Role"
            value={q.role}
            onChange={(v) => set('role', v)}
            options={[
              { value: '', label: 'All roles' },
              { value: 'user', label: 'Customers' },
              { value: 'admin', label: 'Admins' },
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
                  <Th>Name</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Orders</Th>
                  <Th className="text-right">Spent</Th>
                  <Th>Role</Th>
                  <Th>Account active</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={6} />
                ) : data.users.length === 0 ? (
                  <EmptyRow cols={6}>No accounts found.</EmptyRow>
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
                                {u.name} {self && <span className="text-xs text-taupe">(you)</span>}
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
                            <Badge>Admin</Badge>
                          ) : (
                            <select
                              aria-label={`Role for ${u.name}`}
                              value={u.role}
                              disabled={busy(u._id)}
                              onChange={(e) => update.mutate({ id: u._id, role: e.target.value })}
                              className="h-9 border border-line bg-white px-2 text-sm outline-none focus:border-ink"
                            >
                              <option value="user">Customer</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Switch
                              label={`${u.isActive ? 'Disable' : 'Enable'} ${u.name}`}
                              checked={u.isActive}
                              disabled={self || busy(u._id)}
                              onChange={(isActive) => update.mutate({ id: u._id, isActive })}
                            />
                            {!u.isActive && <Badge>Disabled</Badge>}
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
