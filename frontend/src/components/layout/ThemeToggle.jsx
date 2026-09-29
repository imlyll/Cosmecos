import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

/** Sun / moon button; the icon rotates out and the next one rises in. `withLabel` adds the theme name. */
export default function ThemeToggle({ className, withLabel = false }) {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? t('theme.toLight') : t('theme.toDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={clsx(
        'relative flex items-center gap-2.5 text-ink transition-colors duration-300 hover:text-rose',
        className
      )}
    >
      <span className="relative grid size-[34px] place-items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            className="grid place-items-center"
            initial={{ y: 14, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -14, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {isDark ? <Moon className="size-[21px]" strokeWidth={1.2} /> : <Sun className="size-[22px]" strokeWidth={1.2} />}
          </motion.span>
        </AnimatePresence>
      </span>
      {withLabel && (
        <span className="font-serif text-[13px] font-bold tracking-[0.12em] uppercase">
          {isDark ? t('theme.dark') : t('theme.light')}
        </span>
      )}
    </button>
  );
}
