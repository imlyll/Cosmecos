import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Users, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/auth';
import { useLogout } from '../hooks/useAuth';
import { EASE } from '../lib/motion';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];

function SidebarContent({ onNavigate }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-7">
        <Link to="/admin" onClick={onNavigate} className="font-serif text-3xl text-cream">
          cosme<span className="text-blush italic">cos</span>
        </Link>
        <p className="mt-1 text-[10px] tracking-[0.3em] text-cream/40 uppercase">Admin panel</p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                isActive ? 'text-ink' : 'text-cream/60 hover:text-cream'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="admin-nav" className="absolute inset-0 bg-cream" transition={{ duration: 0.4, ease: EASE }} />
                )}
                <Icon className="relative size-4" strokeWidth={1.6} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-cream/10 px-3 py-4">
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-cream">
          <ExternalLink className="size-4" strokeWidth={1.6} /> View store
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-cream"
        >
          <LogOut className="size-4" strokeWidth={1.6} /> Sign out
        </button>
        <div className="mt-3 flex items-center gap-3 px-4 pt-3">
          <span className="grid size-9 place-items-center rounded-full bg-rose font-serif text-lg text-cream">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-cream">{user?.name}</p>
            <p className="truncate text-xs text-cream/40">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Captured per render so the exiting page keeps its own content during the fade-out
  // (a live <Outlet/> would briefly render the next page inside the old container).
  const outlet = useOutlet();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-svh bg-cream lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-ink lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-ink px-4 text-cream lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-2">
          <Menu className="size-5" />
        </button>
        <span className="font-serif text-2xl">
          cosme<span className="text-blush italic">cos</span>
        </span>
        <span className="w-9" />
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <motion.div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 bg-ink"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-6 right-4 p-1 text-cream">
                <X className="size-5" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
