import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Pencil, Plus, Trash2, ExternalLink, ImageOff } from 'lucide-react';
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

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'price_asc', label: 'Price low–high' },
  { value: 'price_desc', label: 'Price high–low' },
  { value: 'best_selling', label: 'Best selling' },
];

const STATUS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Hidden' },
];

const STOCK = [
  { value: '', label: 'Any stock' },
  { value: 'true', label: 'In stock' },
  { value: 'false', label: 'Out of stock' },
];

export default function Products() {
  useDocumentTitle('Products · Admin');
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
        title="Products"
        subtitle={isLoading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
        actions={
          <Button to="/admin/products/new">
            <Plus className="size-4" /> Add new product
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_150px_150px_170px]">
          <SearchInput value={q.search} onChange={(v) => set('search', v)} placeholder="Search name, brand or tag…" />
          <Select
            label="Category"
            value={q.category}
            onChange={(v) => set('category', v)}
            options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.slug, label: c.parent ? `— ${c.name}` : c.name }))]}
          />
          <Select label="Status" value={q.active} onChange={(v) => set('active', v)} options={STATUS} />
          <Select label="Stock" value={q.inStock} onChange={(v) => set('inStock', v)} options={STOCK} />
          <Select label="Sort" value={q.sort} onChange={(v) => set('sort', v === 'newest' ? '' : v)} options={SORTS} />
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className={clsx('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
            <Table minWidth={880}>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Sold</Th>
                  <Th>Visible</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={7} />
                ) : data.products.length === 0 ? (
                  <EmptyRow cols={7}>No products match these filters.</EmptyRow>
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
                                {p.variants?.length ? `${p.variants.length} variants` : p.sku || p.brand}
                                {p.isFeatured && ' · Featured'}
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
                          {p.stock === 0 ? 'Out' : p.stock}
                        </Td>
                        <Td className="text-right text-taupe">{p.sold}</Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={p.isActive}
                              label={`${p.isActive ? 'Hide' : 'Show'} ${p.name}`}
                              disabled={toggle.isPending && toggle.variables?.product._id === p._id}
                              onChange={() => toggle.mutate({ product: p })}
                            />
                            <Badge>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex justify-end gap-1">
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View ${p.name} in store`}
                              className="grid size-9 place-items-center text-taupe hover:text-ink"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                            <Link
                              to={`/admin/products/${p._id}/edit`}
                              aria-label={`Edit ${p.name}`}
                              className="grid size-9 place-items-center text-taupe hover:text-ink"
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setToDelete(p)}
                              aria-label={`Delete ${p.name}`}
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
        title="Delete product?"
        text={`“${toDelete?.name}” will be permanently removed, along with its images, and taken out of customers’ carts and wishlists. Past orders keep their records.`}
      />
    </>
  );
}
