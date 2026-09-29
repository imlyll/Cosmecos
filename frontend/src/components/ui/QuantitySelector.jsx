import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

/** Three separate outlined squares: − | qty | +, as in the theme (compact 40px boxes when size="sm"). */
export default function QuantitySelector({ value, onChange, min = 1, max = 99, size = 'md', disabled }) {
  const { t } = useTranslation();
  const box = clsx(
    'grid place-items-center border border-ink bg-white text-ink',
    size === 'sm' ? 'size-10' : 'size-14'
  );
  const btn = clsx(box, 'transition-colors duration-300 hover:bg-ink hover:text-white disabled:cursor-default disabled:hover:bg-white disabled:hover:text-ink');
  return (
    <div className={clsx('inline-flex items-center', size === 'sm' ? 'gap-1.5' : 'gap-[9px]', disabled && 'opacity-60')}>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={t('a11y.decreaseQty')}
      >
        <Minus className="size-4" strokeWidth={1.5} />
      </button>
      <div className={clsx(box, 'relative overflow-hidden font-serif text-[13px] font-bold')} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="block"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={t('a11y.increaseQty')}
      >
        <Plus className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
