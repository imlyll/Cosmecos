import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ChevronDown, Heart, LayoutDashboard, Menu, Search, ShoppingBag, User } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Logo } from '../ui/Brand';
import { NAV_LINKS } from './nav';
import LanguageSwitcher from './LanguageSwitcher';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/auth';
import { useUIStore } from '../../store/ui';
import { EASE } from '../../lib/motion';

/** Small peach bubble sitting on the lower-left of the bag icon. */
function CountBadge({ count }) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.4 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="absolute bottom-0 -left-2 grid size-4 place-items-center rounded-full bg-rose font-sans text-[10px] leading-none text-white"
    >
      {count}
    </motion.span>
  );
}

function IconButton({ label, onClick, to, children }) {
  const cls = 'relative grid size-[34px] place-items-center text-ink transition-colors duration-300 hover:text-rose';
  return to ? (
    <Link to={to} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// A top-level item is active on its own page or any page in its dropdown.
const isActiveLink = (link, pathname) => {
  if (link.to === '/') return pathname === '/';
  const paths = [link.to, ...(link.children || []).map((c) => c.to)].map((to) => to.split('?')[0]);
  return paths.includes(pathname) || (link.id === 'shop' && pathname.startsWith('/product'));
};

function NavItem({ link }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const active = isActiveLink(link, pathname);

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <NavLink
        to={link.to}
        end={link.to === '/'}
        aria-haspopup={link.children ? 'true' : undefined}
        aria-expanded={link.children ? open : undefined}
        className="relative flex h-[98px] items-center gap-[13px] font-serif text-[15px] font-medium text-ink uppercase transition-colors duration-300 hover:text-rose"
      >
        {t(link.label)}
        {link.children && (
          <ChevronDown
            className={clsx('size-3.5 transition-transform duration-300', open && 'rotate-180')}
            strokeWidth={1.5}
          />
        )}
        {active && (
          <motion.span
            layoutId="nav-underline"
            className="absolute inset-x-0 bottom-0 h-[2px] bg-ink"
            transition={{ duration: 0.5, ease: EASE }}
          />
        )}
      </NavLink>

      <AnimatePresence>
        {link.children && open && (
          <motion.ul
            className="absolute top-full -left-[34px] z-10 w-[290px] bg-ink-soft py-[26px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 6 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {link.children.map((child) => (
              <li key={child.label}>
                <Link
                  to={child.to}
                  onClick={() => setOpen(false)}
                  className="block px-[34px] py-[5px] font-serif text-[17px] leading-[31px] font-medium text-white transition-colors duration-300 hover:text-rose"
                >
                  {t(child.label)}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

/** 3 × 3 peach dots in the dark square that opens the side panel. */
function DotsIcon() {
  return (
    <span className="grid grid-cols-3 gap-[6px]" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="size-1 rounded-full bg-rose" />
      ))}
    </span>
  );
}

/**
 * White header: wordmark on the left, centred menu with dark dropdowns,
 * account / wishlist / bag / search icons and a dark square that opens the side panel.
 * Hides while scrolling down and slides back in when scrolling up.
 */
export default function Header() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [raised, setRaised] = useState(false);

  const { cart } = useCart();
  const { count: wishCount } = useWishlist();
  const user = useAuthStore((s) => s.user);
  const { setSearchOpen, setCartOpen, setMenuOpen, setPanelOpen, openAuth } = useUIStore();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setRaised(y > 140);
    setHidden(y > 400 && y > prev);
  });

  return (
    <motion.header
      className={clsx(
        'sticky top-0 z-50 w-full bg-white transition-shadow duration-500',
        raised && 'shadow-[0_5px_30px_rgba(0,0,0,0.07)]'
      )}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="flex h-[70px] items-center pl-4 sm:pl-6 lg:h-[98px] lg:pl-10">
        <Logo />

        <nav aria-label="Main" className="hidden flex-1 justify-center xl:flex">
          <ul className="flex items-center gap-[52px]">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.label} link={link} />
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 pr-2 sm:gap-4 xl:ml-0 xl:pr-[30px]">
          <LanguageSwitcher className="mr-1 hidden md:block" />
          {user?.role === 'admin' && (
            <span className="hidden sm:block">
              <IconButton label={t('nav.adminPanel')} to="/admin">
                <LayoutDashboard className="size-[22px]" strokeWidth={1.2} />
              </IconButton>
            </span>
          )}
          <span className="hidden sm:block">
            {user ? (
              <IconButton label={t('header.myAccount')} to="/profile">
                <User className="size-6" strokeWidth={1.2} />
              </IconButton>
            ) : (
              <IconButton label={t('header.signIn')} onClick={() => openAuth('login')}>
                <User className="size-6" strokeWidth={1.2} />
              </IconButton>
            )}
          </span>
          <IconButton label={t('header.wishlist', { count: wishCount })} to="/wishlist">
            <Heart className="size-6" strokeWidth={1.2} />
          </IconButton>
          <IconButton label={t('header.bag', { count: cart.itemCount })} onClick={() => setCartOpen(true)}>
            <ShoppingBag className="size-6" strokeWidth={1.2} />
            <CountBadge count={cart.itemCount} />
          </IconButton>
          <IconButton label={t('header.search')} onClick={() => setSearchOpen(true)}>
            <Search className="size-6" strokeWidth={1.2} />
          </IconButton>
          <span className="xl:hidden">
            <IconButton label={t('header.openMenu')} onClick={() => setMenuOpen(true)}>
              <Menu className="size-6" strokeWidth={1.2} />
            </IconButton>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label={t('header.openPanel')}
          className="hidden h-full w-[89px] shrink-0 place-items-center bg-ink transition-colors duration-300 hover:bg-black lg:grid"
        >
          <DotsIcon />
        </button>
      </div>
    </motion.header>
  );
}
