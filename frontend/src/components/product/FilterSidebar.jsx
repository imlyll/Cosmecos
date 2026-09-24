import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import PriceRange from './PriceRange';
import MiniProduct from './MiniProduct';
import { useCategories, useFilterOptions, useProducts } from '../../hooks/useCatalog';

function Widget({ title, children, className }) {
  return (
    <section className={clsx('mb-[60px]', className)}>
      {title && <h2 className="title-line mb-4 text-[26px] leading-[38px] font-normal tracking-[0.005em]">{title}</h2>}
      {children}
    </section>
  );
}

function SearchWidget({ value, onSearch }) {
  const [q, setQ] = useState(value || '');
  useEffect(() => setQ(value || ''), [value]);
  return (
    <form
      role="search"
      className="relative mb-[70px]"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q.trim());
      }}
    >
      <label htmlFor="shop-search" className="sr-only">
        Search products
      </label>
      <input
        id="shop-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        className="input-luxe pr-14"
      />
      <button type="submit" aria-label="Search" className="absolute top-0 right-0 grid h-14 w-14 place-items-center text-ink">
        <Search className="size-[22px]" strokeWidth={1.3} />
      </button>
    </form>
  );
}

function PriceWidget({ filters, setFilter }) {
  const { data: options } = useFilterOptions();
  const min = Math.floor(options?.priceRange.min ?? 0);
  const max = Math.ceil(options?.priceRange.max ?? 100);
  const current = [Number(filters.minPrice ?? min), Number(filters.maxPrice ?? max)];
  const [range, setRange] = useState(current);

  // Follow the URL when it changes elsewhere (e.g. "clear filters").
  useEffect(() => setRange(current), [current[0], current[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!options) return null;
  return (
    <Widget title="Filter by price">
      <div className="px-1 pt-2">
        <PriceRange min={min} max={max} value={range} onChange={setRange} />
      </div>
      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="font-serif text-sm font-medium text-ink uppercase">
          Price: ${range[0]} — ${range[1]}
        </p>
        <button
          type="button"
          onClick={() => setFilter({ minPrice: range[0] > min ? range[0] : '', maxPrice: range[1] < max ? range[1] : '' })}
          className="btn-cos h-10 px-[33px]"
        >
          Filter
        </button>
      </div>
    </Widget>
  );
}

/** Shop sidebar: search, categories, price filter, newest products, tags and a promo picture. */
export default function FilterSidebar({ filters, setFilter }) {
  const { data: categories = [] } = useCategories();
  const { data: options } = useFilterOptions();
  const { data: newest } = useProducts({ sort: 'newest', limit: 3 });
  const selectedTags = filters.tags ? filters.tags.split(',') : [];

  const toggleTag = (tag) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setFilter('tags', next.join(','));
  };

  return (
    <div>
      <SearchWidget value={filters.search} onSearch={(q) => setFilter('search', q)} />

      <Widget title="Categories">
        <ul>
          {categories
            .filter((c) => !c.parent)
            .map((cat) => {
              const active = filters.category === cat.slug;
              return (
                <li key={cat._id} className="flex items-center gap-4 py-1.5">
                  <span className={clsx('size-[5px] shrink-0 rounded-full border', active ? 'border-rose bg-rose' : 'border-ink')} />
                  <button
                    type="button"
                    onClick={() => setFilter('category', active ? '' : cat.slug)}
                    aria-pressed={active}
                    className={clsx(
                      'text-left font-serif font-medium transition-colors hover:text-rose',
                      active ? 'text-rose' : 'text-ink'
                    )}
                  >
                    {cat.name} <span className="text-mute">({cat.productCount})</span>
                  </button>
                </li>
              );
            })}
        </ul>
      </Widget>

      <PriceWidget filters={filters} setFilter={setFilter} />

      <Widget title="Meet New Arrivals">
        <div className="space-y-[30px]">
          {newest?.products.map((p) => (
            <MiniProduct key={p._id} product={p} size="sm" />
          ))}
        </div>
      </Widget>

      <Widget title="Product tags">
        <div className="-mx-[5px] flex flex-wrap">
          {(options?.tags || []).map((t) => {
            const active = selectedTags.includes(t.name);
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => toggleTag(t.name)}
                aria-pressed={active}
                className={clsx(
                  'mx-[5px] mt-2.5 border px-[9px] py-[3px] font-serif leading-[22px] font-medium capitalize transition-colors duration-300',
                  active ? 'border-ink bg-ink text-white' : 'border-black text-ink hover:bg-ink hover:text-white'
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </Widget>

      <Link to="/shop" className="block overflow-hidden">
        <img src="/images/banner.jpg" alt="Beauty" className="w-full transition-transform duration-[1.2s] hover:scale-105" />
      </Link>
    </div>
  );
}
