import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, SearchX } from 'lucide-react';
import clsx from 'clsx';
import PageHero, { HERO_IMAGES } from '../components/ui/PageHero';
import FilterSidebar from '../components/product/FilterSidebar';
import ProductGrid from '../components/product/ProductGrid';
import { CartRow, ProductImage } from '../components/product/ProductCard';
import Pagination from '../components/ui/Pagination';
import Rating from '../components/ui/Rating';
import { EmptyState, ErrorState, ProductCardSkeleton } from '../components/ui/Feedback';
import { useCategories, useProducts } from '../hooks/useCatalog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EASE } from '../lib/motion';
import { useTranslation } from 'react-i18next';

// WooCommerce-style sort menu; "Default sorting" is alphabetical like the demo catalogue. Labels are translation keys.
const SORT_OPTIONS = [
  { value: 'name_asc', label: 'shop.sort.default' },
  { value: 'best_selling', label: 'shop.sort.popularity' },
  { value: 'rating', label: 'shop.sort.rating' },
  { value: 'newest', label: 'shop.sort.latest' },
  { value: 'price_asc', label: 'shop.sort.priceAsc' },
  { value: 'price_desc', label: 'shop.sort.priceDesc' },
];

const FILTER_KEYS = ['category', 'search', 'minPrice', 'maxPrice', 'tags', 'onSale'];
const PAGE_SIZE = 9;

function GridIcon() {
  return (
    <span className="grid grid-cols-3 gap-[2px]" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="size-1 bg-current" />
      ))}
    </span>
  );
}

function ListIcon() {
  return (
    <span className="grid gap-[2px]" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className="flex gap-[2px]">
          <span className="h-1 w-1 bg-current" />
          <span className="h-1 w-[14px] bg-current" />
        </span>
      ))}
    </span>
  );
}

/** Wide list-view row: picture on the left, details and cart row on the right. */
function ProductRow({ product }) {
  const url = `/product/${product.slug}`;
  return (
    <motion.article
      className="grid gap-[30px] sm:grid-cols-[270px_1fr]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <ProductImage product={product} to={url} />
      <div className="self-center">
        <Rating value={product.rating || 0} />
        <h3 className="mt-3 text-2xl font-normal">
          <Link to={url} className="transition-colors hover:text-rose">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="mt-3 line-clamp-3 text-taupe">{product.shortDescription.split('\n')[0]}</p>
        )}
        <CartRow product={product} className="mt-6 max-w-[330px]" />
      </div>
    </motion.article>
  );
}

export default function Shop() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const { data: categories = [] } = useCategories();

  const filters = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const page = Number(filters.page || 1);
  const sort = filters.sort || 'name_asc';

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts({
    ...Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k]])),
    sort,
    page,
    limit: PAGE_SIZE,
  });

  /** setFilter('key', value) or setFilter({ key: value, ... }); resets to page 1. */
  const setFilter = (keyOrObj, value) => {
    const updates = typeof keyOrObj === 'string' ? { [keyOrObj]: value } : keyOrObj;
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, String(v))));
    if (!('page' in updates)) next.delete('page');
    setParams(next, { preventScrollReset: true });
  };

  const goToPage = (p) => {
    setFilter('page', p === 1 ? '' : p);
    window.scrollTo({ top: 450, behavior: 'smooth' });
  };

  const category = categories.find((c) => c.slug === filters.category);
  useDocumentTitle(category?.name || t('nav.shop'));

  const hasFilters = FILTER_KEYS.some((k) => filters[k]);
  const clearAll = () => setParams(filters.sort ? { sort: filters.sort } : {}, { preventScrollReset: true });

  const pagination = data?.pagination;
  const from = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = pagination ? Math.min(pagination.total, pagination.page * pagination.limit) : 0;
  const products = data?.products || [];

  return (
    <>
      <PageHero
        title={category?.name || (filters.search ? t('shop.searchResults') : t('shop.title'))}
        image={HERO_IMAGES.beauty}
      />

      <div className="container-luxe py-[150px] max-md:py-20">
        <div className="grid gap-[60px] lg:grid-cols-[1fr_270px] lg:gap-[33px]">
          <div className="min-w-0">
            {/* Toolbar */}
            <div className="mb-[65px] flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <p className="font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase" aria-live="polite">
                {pagination?.total
                  ? pagination.total <= PAGE_SIZE && page === 1
                    ? t('shop.showingAll', { count: pagination.total })
                    : t('shop.showingRange', { from, to, total: pagination.total })
                  : isLoading
                    ? t('common.loading')
                    : t('shop.noResults')}
              </p>
              <div className="flex items-center gap-10">
                <label className="relative block">
                  <span className="sr-only">{t('shop.sortLabel')}</span>
                  <select
                    value={sort}
                    onChange={(e) => setFilter('sort', e.target.value === 'name_asc' ? '' : e.target.value)}
                    className="w-[248px] cursor-pointer appearance-none border-b border-line bg-transparent py-0.5 pr-6 pl-[5px] font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase outline-none focus:border-ink"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(o.label)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-1 size-3.5 -translate-y-1/2 text-mute"
                    strokeWidth={1.5}
                  />
                </label>
                <div className="flex items-center gap-2" role="group" aria-label={t('shop.view')}>
                  {[
                    { id: 'grid', Icon: GridIcon },
                    { id: 'list', Icon: ListIcon },
                  ].map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      aria-pressed={view === id}
                      aria-label={t(`shop.${id}View`)}
                      className={clsx('grid size-6 place-items-center', view === id ? 'text-ink' : 'text-mute hover:text-ink')}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {hasFilters && (
                <motion.p
                  className="-mt-10 mb-10 text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <button type="button" onClick={clearAll} className="link-underline font-serif font-semibold text-rose uppercase">
                    {t('shop.clearFilters')}
                  </button>
                </motion.p>
              )}
            </AnimatePresence>

            <div className={clsx('transition-opacity duration-300', isFetching && !isLoading && 'opacity-60')}>
              {isError ? (
                <ErrorState error={error} onRetry={refetch} />
              ) : !isLoading && products.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title={t('shop.emptyTitle')}
                  text={t('shop.emptyText')}
                />
              ) : view === 'grid' ? (
                <ProductGrid products={products} loading={isLoading} columns={3} skeletons={9} />
              ) : (
                <div className="space-y-[60px]">
                  {isLoading
                    ? Array.from({ length: 3 }, (_, i) => <ProductCardSkeleton key={i} />)
                    : products.map((p) => <ProductRow key={p._id} product={p} />)}
                </div>
              )}
            </div>

            {pagination && <Pagination page={pagination.page} pages={pagination.pages} onChange={goToPage} />}
          </div>

          <aside aria-label={t('filters.sidebar')}>
            <FilterSidebar filters={filters} setFilter={setFilter} />
          </aside>
        </div>
      </div>
    </>
  );
}

