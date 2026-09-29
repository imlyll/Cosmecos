import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  return list.flatMap((p, i) => (i && p - list[i - 1] > 1 ? ['…', p] : [p]));
}

/** Square numbered pages with Prev / Next text buttons, as in the theme. */
export default function Pagination({ page, pages, onChange }) {
  const { t } = useTranslation();
  if (pages <= 1) return null;
  const btn =
    'grid h-10 min-w-10 place-items-center border border-ink font-sans text-[13px] font-bold tracking-[0.05em] uppercase transition-colors duration-300';
  return (
    <nav aria-label={t('a11y.pagination')} className="mt-10 flex flex-wrap justify-center gap-5">
      {page > 1 && (
        <button type="button" onClick={() => onChange(page - 1)} className={clsx(btn, 'px-4 text-ink hover:bg-ink hover:text-white')}>
          {t('common.prev')}
        </button>
      )}
      {pageList(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="grid h-10 place-items-center text-mute">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={clsx(btn, 'px-[5px]', p === page ? 'bg-ink text-white' : 'text-ink hover:bg-ink hover:text-white')}
          >
            {p}
          </button>
        )
      )}
      {page < pages && (
        <button type="button" onClick={() => onChange(page + 1)} className={clsx(btn, 'px-4 text-ink hover:bg-ink hover:text-white')}>
          {t('common.next')}
        </button>
      )}
    </nav>
  );
}
