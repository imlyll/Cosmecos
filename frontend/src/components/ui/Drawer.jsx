import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { EASE } from '../../lib/motion';
import { useTranslation } from 'react-i18next';

function useLockBody(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

/** Side panel sliding in from the left or right. */
export function Drawer({ open, onClose, side = 'right', title, children, className }) {
  const { t } = useTranslation();
  useLockBody(open, onClose);
  const offset = side === 'right' ? '100%' : '-100%';
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.aside
            className={clsx(
              'absolute top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl',
              side === 'right' ? 'right-0' : 'left-0',
              className
            )}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-2xl">{title}</h2>
              <button type="button" onClick={onClose} aria-label={t('a11y.close')} className="group p-1">
                <X className="size-5 transition-transform duration-500 group-hover:rotate-90" />
              </button>
            </div>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Centered dialog with a scale-in animation. */
export function Modal({ open, onClose, children, className, label }) {
  const { t } = useTranslation();
  useLockBody(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={clsx('relative max-h-[92vh] w-full overflow-y-auto bg-cream shadow-2xl', className)}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t('a11y.close')}
              className="group absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-cream/80"
            >
              <X className="size-5 transition-transform duration-500 group-hover:rotate-90" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
