import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store/ui';
import { useProducts } from '../../hooks/useCatalog';
import { sizedImage } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { EASE } from '../../lib/motion';
import { useTranslation } from 'react-i18next';

const SUGGESTIONS = ['Serum', 'Lipstick', 'Parfum', 'Cleanser', 'Body oil'];

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchOverlay() {
  const { t } = useTranslation();
  const { searchOpen, setSearchOpen } = useUIStore();
  const [term, setTerm] = useState('');
  const search = useDebounced(term.trim());
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const close = () => setSearchOpen(false);

  const { data, isFetching } = useProducts({ search, limit: 6 }, { enabled: search.length >= 2 });

  useEffect(() => {
    if (!searchOpen) return undefined;
    setTimeout(() => inputRef.current?.focus(), 300);
    const onKey = (e) => e.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [searchOpen, setSearchOpen]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    close();
    navigate(`/shop?search=${encodeURIComponent(term.trim())}`);
  };

  const results = search.length >= 2 ? data?.products || [] : [];

  return createPortal(
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[75] overflow-y-auto bg-cream"
          role="dialog"
          aria-modal="true"
          aria-label={t('header.search')}
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="container-luxe py-8">
            <div className="flex justify-end">
              <button type="button" onClick={close} aria-label={t('search.close')} className="group p-2">
                <X className="size-6 transition-transform duration-500 group-hover:rotate-90" />
              </button>
            </div>
            <motion.form
              onSubmit={onSubmit}
              className="mx-auto mt-10 max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            >
              <p className="eyebrow mb-4 text-center">{t('search.title')}</p>
              <div className="flex items-center border-b border-ink pb-3">
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.label')}
                  className="w-full bg-transparent font-serif text-3xl outline-none placeholder:text-taupe/50 md:text-5xl"
                />
                <button type="submit" aria-label={t('common.search')} className="p-2">
                  <Search className="size-6" strokeWidth={1.5} />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTerm(s)}
                    className="border border-line px-4 py-1.5 text-xs tracking-wider transition-colors hover:border-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.form>

            <div className="mx-auto mt-12 max-w-3xl">
              {isFetching && <p className="text-center text-sm text-taupe">{t('search.searching')}</p>}
              {!isFetching && search.length >= 2 && results.length === 0 && (
                <p className="text-center text-sm text-taupe">{t('search.noResults', { term: search })}</p>
              )}
              <ul className="grid gap-4 sm:grid-cols-2">
                {results.map((p, i) => (
                  <motion.li
                    key={p._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/product/${p.slug}`}
                      onClick={close}
                      className="group flex items-center gap-4 bg-white p-3 transition-shadow hover:shadow-lg"
                    >
                      <img
                        src={sizedImage(p.images?.[0]?.url, 160)}
                        alt=""
                        className="size-16 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-lg">{p.name}</p>
                        <p className="text-sm text-taupe">{formatPrice(p.price)}</p>
                      </div>
                      <ArrowRight className="size-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
              {results.length > 0 && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={onSubmit} className="link-underline text-xs tracking-[0.2em] uppercase">
                    {t('search.viewAll')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
