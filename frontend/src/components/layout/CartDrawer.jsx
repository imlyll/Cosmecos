import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import Button from '../ui/Button';
import QuantitySelector from '../ui/QuantitySelector';
import FreeShippingBar from '../product/FreeShippingBar';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../../hooks/useCart';
import { useUIStore } from '../../store/ui';
import { useAuthStore } from '../../store/auth';
import { sizedImage } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { useTranslation } from 'react-i18next';

export default function CartDrawer() {
  const { t } = useTranslation();
  const { cartOpen, setCartOpen, openAuth } = useUIStore();
  const token = useAuthStore((s) => s.token);
  const { cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const close = () => setCartOpen(false);

  return (
    <Drawer open={cartOpen} onClose={close} title={t('cart.title', { count: cart.itemCount })}>
      {!token ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ShoppingBag className="size-10 text-rose" strokeWidth={1} />
          <p className="mt-5 font-serif text-2xl">{t('cart.signInPrompt')}</p>
          <p className="mt-2 text-sm text-taupe">{t('cart.signInHint')}</p>
          <Button
            className="mt-8"
            onClick={() => {
              close();
              openAuth('login');
            }}
          >
            {t('common.signIn')}
          </Button>
        </div>
      ) : cart.items.length === 0 && !isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ShoppingBag className="size-10 text-rose" strokeWidth={1} />
          <p className="mt-5 font-serif text-2xl">{t('cart.empty')}</p>
          <Button to="/shop" className="mt-8" onClick={close}>
            {t('common.discoverProducts')}
          </Button>
        </div>
      ) : (
        <>
          <div className="px-6 pt-5">
            <FreeShippingBar remaining={cart.amountToFreeShipping} threshold={cart.freeShippingThreshold} />
          </div>
          <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <AnimatePresence initial={false}>
              {cart.items.map((item) => (
                <motion.li
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-4"
                >
                  <Link to={`/product/${item.product.slug}`} onClick={close} className="shrink-0">
                    <img
                      src={sizedImage(item.product.image, 200)}
                      alt={item.product.name}
                      className="h-28 w-22 bg-beige object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={close}
                          className="line-clamp-2 font-serif text-lg leading-tight hover:text-rose"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && <p className="mt-1 text-xs text-taupe">{item.variant.name}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove.mutate({ itemId: item._id })}
                        aria-label={t('cart.remove', { name: item.product.name })}
                        className="p-1 text-taupe hover:text-ink"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantitySelector
                        size="sm"
                        value={item.quantity}
                        max={item.availableStock}
                        onChange={(quantity) => update.mutate({ itemId: item._id, quantity })}
                      />
                      <span className="text-sm font-medium">{formatPrice(item.subtotal)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="border-t border-line px-6 py-6">
            <div className="flex justify-between text-sm">
              <span className="tracking-[0.2em] uppercase">{t('cart.subtotal')}</span>
              <span className="font-medium">{formatPrice(cart.itemsPrice)}</span>
            </div>
            <p className="mt-1 text-xs text-taupe">{t('cart.shippingNote')}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button to="/cart" variant="outline" onClick={close}>
                {t('common.viewBag')}
              </Button>
              <Button to="/checkout" onClick={close}>
                {t('common.checkout')}
              </Button>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
