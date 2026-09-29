import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileMenu from './components/layout/MobileMenu';
import SearchOverlay from './components/layout/SearchOverlay';
import CartDrawer from './components/layout/CartDrawer';
import SidePanel from './components/layout/SidePanel';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute, { SessionLoader } from './components/auth/ProtectedRoute';
import { EASE } from './lib/motion';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';

// Home ships in the main bundle; other pages load on demand.
const About = lazy(() => import('./pages/About'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

/** The customer-facing shop: header, footer, overlays and page transitions. */
export default function Storefront() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        {t('a11y.skipToContent')}
      </a>
      <AnnouncementBar />
      <Header />

      {/* Keyed by pathname only, so filter/query changes on /shop don't replay the transition. */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="min-h-[60vh]"
        >
          <Suspense fallback={<SessionLoader />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/about-us" element={<About />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/cart" element={guard(<Cart />)} />
              <Route path="/checkout" element={guard(<Checkout />)} />
              <Route path="/order-success/:id" element={guard(<OrderSuccess />)} />
              <Route path="/wishlist" element={guard(<Wishlist />)} />
              <Route path="/profile" element={guard(<Profile />)} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      <Footer />
      <MobileMenu />
      <SearchOverlay />
      <CartDrawer />
      <SidePanel />
      <AuthModal />
    </>
  );
}
