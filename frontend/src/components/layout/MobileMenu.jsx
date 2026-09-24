import { Link, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { SocialLinks } from '../ui/Brand';
import { NAV_LINKS, STORE_INFO } from './nav';
import { useUIStore } from '../../store/ui';
import { useAuthStore } from '../../store/auth';
import { EASE } from '../../lib/motion';

export default function MobileMenu() {
  const { menuOpen, setMenuOpen, openAuth } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location, setMenuOpen]);

  return (
    <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu">
      <nav className="flex-1 overflow-y-auto px-6 py-8" aria-label="Mobile">
        <ul className="space-y-1">
          {NAV_LINKS.map((link, i) => (
            <motion.li
              key={link.label}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.06 }}
            >
              <Link to={link.to} className="block py-2 font-serif text-2xl font-light uppercase transition-colors hover:text-rose">
                {link.label}
              </Link>
              {link.children && (
                <ul className="mb-2 border-l border-line pl-4">
                  {link.children.map((child) => (
                    <li key={child.label}>
                      <Link to={child.to} className="block py-1 font-serif text-base font-medium transition-colors hover:text-rose">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.li>
          ))}
        </ul>
        <div className="mt-8 border-t border-line pt-6 text-sm">
          {user ? (
            <div className="flex flex-col items-start gap-3">
              <Link to="/profile" className="link-underline font-serif font-semibold uppercase">
                My account
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="link-underline tracking-[0.2em] uppercase">
                  Admin panel
                </Link>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openAuth('login');
              }}
              className="link-underline tracking-[0.2em] uppercase"
            >
              Sign in / Register
            </button>
          )}
        </div>
      </nav>
      <div className="border-t border-line px-6 py-6 text-sm text-taupe">
        <p>{STORE_INFO.phone}</p>
        <p className="mt-1">{STORE_INFO.email}</p>
        <SocialLinks className="mt-5" itemClassName="border-line text-ink hover:border-ink" />
      </div>
    </Drawer>
  );
}
