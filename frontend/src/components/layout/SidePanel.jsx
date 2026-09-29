import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MapPin, Phone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo, SocialLinks } from '../ui/Brand';
import { STORE_INFO, telHref } from './nav';
import { useUIStore } from '../../store/ui';
import { EASE } from '../../lib/motion';

/** Address, email and phone rows; the address text is translated. */
export function useContactRows() {
  const { t } = useTranslation();
  return [
    { icon: MapPin, text: t('store.address') },
    { icon: Mail, text: STORE_INFO.email, href: `mailto:${STORE_INFO.email}` },
    { icon: Phone, text: STORE_INFO.phone, href: telHref(STORE_INFO.phone) },
  ];
}

/** Contact lines with thin grey icons, used in the side panel and footer. */
export function ContactList({ rows, className }) {
  const defaults = useContactRows();
  return (
    <ul className={className}>
      {(rows || defaults).map(({ icon: Icon, text, href }) => (
        <li key={text} className="flex items-center gap-5 py-[2.5px] font-serif text-base font-medium text-white">
          <Icon className="size-[18px] shrink-0 text-[#8b8b8b]" strokeWidth={1} />
          {href ? (
            <a href={href} className="transition-colors hover:text-rose">
              {text}
            </a>
          ) : (
            text
          )}
        </li>
      ))}
    </ul>
  );
}

/** Dark information panel opened by the dotted square in the header (dark in both themes). */
export default function SidePanel() {
  const { t } = useTranslation();
  const { panelOpen, setPanelOpen } = useUIStore();
  const { pathname } = useLocation();
  const close = () => setPanelOpen(false);

  useEffect(() => setPanelOpen(false), [pathname, setPanelOpen]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setPanelOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, setPanelOpen]);

  return createPortal(
    <AnimatePresence>
      {panelOpen && (
        <div className="theme-light fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('a11y.information')}>
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.aside
            className="absolute top-0 right-0 h-full w-full max-w-[415px] overflow-y-auto bg-ink-soft px-[50px] pt-[108px] pb-12"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <button
              type="button"
              onClick={close}
              aria-label={t('a11y.close')}
              className="group absolute top-[45px] right-[50px] text-white"
            >
              <X className="size-7 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1} />
            </button>
            <Logo light />
            <p className="mt-[25px] text-base leading-[30px] text-[#b1b0b0]">{t('sidePanel.text')}</p>

            <h3 className="mt-[70px] mb-4 text-[26px] font-normal text-white">{t('sidePanel.contactUs')}</h3>
            <ContactList />

            <h3 className="mt-[70px] mb-6 text-[26px] font-normal text-white">{t('sidePanel.followUs')}</h3>
            <SocialLinks itemClassName="border-white/30 text-white hover:border-rose hover:bg-rose" />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
