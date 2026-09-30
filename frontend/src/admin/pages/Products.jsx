import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Pencil, Plus, Trash2, ExternalLink, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { ErrorState } from '../../components/ui/Feedback';
import { Badge, Card, ConfirmDialog, EmptyRow, PageHeader, SearchInput, Select, SkeletonRows, Switch, Table, Td, Th } from '../ui';
import { useAdminProducts, useDeleteProduct, useToggleProductActive } from '../useAdmin';
import { useCategories } from '../../hooks/useCatalog';
import { sizedImage } from '../../lib/api';
import { formatPrice, priceRange } from '../../lib/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// Option labels are translation keys.
const SORTS = [
  { value: 'newest', key: 'admin.products.sorts.newest' },
  { value: 'name_asc', key: 'admin.products.sorts.nameAsc' },
  { value: 'price_asc', key: 'admin.products.sorts.priceAsc' },
  { value: 'price_desc', key: 'admin.products.sorts.priceDesc' },
  { value: 'best_selling', key: 'admin.products.sorts.bestSelling' },
];

const STATUS = [
  { value: '', key: 'admin.products.allStatuses' },
  { value: 'true', key: 'admin.badge.active' },
  { value: 'false', key: 'admin.badge.hidden' },
];

const STOCK = [
  { value: '', key: 'admin.products.anyStock' },
  { value: 'true', key: 'admin.products.inStock' },
  { value: 'false', key: 'admin.products.outOfStock' },
];

export default function Products() {
  const { t } = useTranslation();
  const tp = (key, opts) => t(`admin.products.${key}`, opts);
  const options = (list) => list.map(({ value, key }) => ({ value, label: t(key) }));
  useDocumentTitle(t('admin.docTitle.products'));
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState(null);
  const { data: categories = [] } = useCategories();

  const q = {
    search: params.get('search') || '',
    category: params.get('category') || '',
    active: params.get('active') || '',
    inStock: params.get('inStock') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page') || 1),
  };
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminProducts({
    ...q,
    includeInactive: true,
    limit: 10,
  });
  const toggle = useToggleProductActive();
  const remove = useDeleteProduct();

  const confirmDelete = () =>
    remove.mutate({ id: toDelete._id, name: toDelete.name }, { onSuccess: () => setToDelete(null) });

  const total = data?.pagination?.total ?? 0;

  return (
    <>
      <PageHeader
        title={tp('title')}
        subtitle={isLoading ? t('admin.common.loading') : tp('count', { count: total })}
        actions={
          <Button to="/admin/products/new">
            <Plus className="size-4" /> {tp('add')}
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_150px_150px_170px]">
          <SearchInput value={q.search} onChange={(v) => set('search', v)} placeholder={tp('searchPlaceholder')} />
          <Select
            label={tp('category')}
            value={q.category}
            onChange={(v) => set('category', v)}
            options={[{ value: '', label: tp('allCategories') }, ...categories.map((c) => ({ value: c.slug, label: c.parent ? `— ${c.name}` : c.name }))]}
          />
          <Select label={tp('status')} value={q.active} onChange={(v) => set('active', v)} options={options(STATUS)} />
          <Select label={tp('stock')} value={q.inStock} onChange={(v) => set('inStock', v)} options={options(STOCK)} />
          <Select label={tp('sort')} value={q.sort} onChange={(v) => set('sort', v === 'newest' ? '' : v)} options={options(SORTS)} />
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className={clsx('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
            <Table minWidth={880}>
              <thead>
                <tr>
                  <Th>{tp('col.product')}</Th>
                  <Th>{tp('col.category')}</Th>
                  <Th className="text-right">{tp('col.price')}</Th>
                  <Th className="text-right">{tp('col.stock')}</Th>
                  <Th className="text-right">{tp('col.sold')}</Th>
                  <Th>{tp('col.visible')}</Th>
                  <Th className="text-right">{tp('col.actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={7} />
                ) : data.products.length === 0 ? (
                  <EmptyRow cols={7}>{tp('empty')}</EmptyRow>
                ) : (
                  data.products.map((p) => {
                    const { min, max } = priceRange(p);
                    return (
                      <tr key={p._id} className="transition-colors hover:bg-cream">
                        <Td>
                          <div className="flex items-center gap-3">
                            {p.images?.[0] ? (
                              <img src={sizedImage(p.images[0].url, 100)} alt="" className="size-12 shrink-0 bg-beige object-cover" />
                            ) : (
                              <span className="grid size-12 shrink-0 place-items-center bg-beige text-taupe">
                                <ImageOff className="size-4" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <Link to={`/admin/products/${p._id}/edit`} className="block truncate font-medium hover:text-rose">
                                {p.name}
                              </Link>
                              <p className="text-xs text-taupe">
                                {p.variants?.length ? tp('variants', { count: p.variants.length }) : p.sku || p.brand}
                                {p.isFeatured && ` · ${tp('featured')}`}
                              </p>
                            </div>
                          </div>
                        </Td>
                        <Td className="text-taupe">{p.category?.name || '—'}</Td>
                        <Td className="text-right whitespace-nowrap">
                          {min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`}
                          {p.compareAtPrice > p.price && (
                            <span className="block text-xs text-taupe line-through">{formatPrice(p.compareAtPrice)}</span>
                          )}
                        </Td>
                        <Td className={clsx('text-right', p.stock === 0 ? 'text-danger' : p.stock <= 5 && 'text-rose')}>
                          {p.stock === 0 ? tp('out') : p.stock}
                        </Td>
                        <Td className="text-right text-taupe">{p.sold}</Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={p.isActive}
                              label={tp(p.isActive ? 'hide' : 'show', { name: p.name })}
                              disabled={toggle.isPending && toggle.variables?.product._id === p._id}
                              onChange={() => toggle.mutate({ product: p })}
                            />
                            <Badge tone={p.isActive ? 'Active' : 'Hidden'} />
                          </div>
                        </Td>
                        <Td>
                          <div className="flex justify-end gap-1">
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={tp('viewInStore', { name: p.name })}
                              className="grid size-9 place-items-center text-taupe hover:text-ink"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                            <Link
                              to={`/admin/products/${p._id}/edit`}
                              aria-label={tp('edit', { name: p.name })}
                              className="grid size-9 place-items-center text-taupe hover:text-ink"
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setToDelete(p)}
                              aria-label={tp('delete', { name: p.name })}
                              className="grid size-9 place-items-center text-taupe hover:text-danger"
                            >
                              <Trash2 className="size-4" />
                            </button>
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

      {data?.pagination && (
        <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={(p) => set('page', p > 1 ? String(p) : '')} />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={tp('deleteTitle')}
        text={tp('deleteText', { name: toDelete?.name })}
      />
    </>
  );
}
