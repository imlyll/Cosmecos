import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { LANGUAGES } from '../../i18n';
import { EASE } from '../../lib/motion';

function useLanguage() {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) || LANGUAGES[1];
  return [current, (code) => i18n.changeLanguage(code)];
}

/** "AZE | ENG | RU" row of text buttons; `dark` styles it for dark surfaces (admin sidebar). */
export function LanguageToggle({ className, dark = false }) {
  const { t } = useTranslation();
  const [current, setLanguage] = useLanguage();
  return (
    <div role="group" aria-label={t('language.label')} className={clsx('flex items-center', className)}>
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          {i > 0 && <span className={clsx('mx-3 h-3 w-px', dark ? 'bg-cream/20' : 'bg-line')} aria-hidden />}
          <button
            type="button"
            lang={lang.code}
            onClick={() => setLanguage(lang.code)}
            aria-pressed={lang.code === current.code}
            title={lang.name}
            className={clsx(
              'relative py-1 font-serif text-[13px] font-bold tracking-[0.12em] uppercase transition-colors duration-300',
              lang.code === current.code ? (dark ? 'text-cream' : 'text-ink') : dark ? 'text-cream/50 hover:text-blush' : 'text-mute hover:text-rose'
            )}
          >
            {lang.label}
            {lang.code === current.code && (
              <motion.span layoutId="lang-toggle-underline" className="absolute inset-x-0 -bottom-0.5 h-px bg-rose" />
            )}
          </button>
        </span>
      ))}
    </div>
  );
}

/** Header language picker: compact code with a dark dropdown matching the main menu. */
export default function LanguageSwitcher({ className }) {
  const { t } = useTranslation();
  const [current, setLanguage] = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={clsx('relative', className)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('language.choose')}: ${current.name}`}
        className="flex h-[34px] items-center gap-1.5 px-1 font-serif text-[13px] font-bold tracking-[0.12em] text-ink uppercase transition-colors duration-300 hover:text-rose"
      >
        {current.label}
        <ChevronDown className={clsx('size-3 transition-transform duration-300', open && 'rotate-180')} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t('language.label')}
            className="absolute top-full right-0 z-20 w-[200px] bg-ink-soft py-4 shadow-[0_15px_40px_rgba(0,0,0,0.18)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 6 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {LANGUAGES.map((lang) => {
              const active = lang.code === current.code;
              return (
                <li key={lang.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    lang={lang.code}
                    onClick={() => choose(lang.code)}
                    className="group flex w-full items-center gap-4 px-6 py-2 text-left"
                  >
                    <span
                      className={clsx(
                        'w-9 font-serif text-[13px] font-bold tracking-[0.12em] uppercase transition-colors duration-300',
                        active ? 'text-rose' : 'text-white group-hover:text-rose'
                      )}
                    >
                      {lang.label}
                    </span>
                    <span className="flex-1 font-serif text-[15px] font-medium text-white/60 transition-colors duration-300 group-hover:text-white">
                      {lang.name}
                    </span>
                    <span
                      className={clsx('size-[5px] rounded-full bg-rose transition-opacity', active ? 'opacity-100' : 'opacity-0')}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
