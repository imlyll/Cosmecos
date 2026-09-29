import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Info, X } from 'lucide-react';
import PageHero, { HERO_IMAGES } from '../components/ui/PageHero';
import QuantitySelector from '../components/ui/QuantitySelector';
import OrderSummary from '../components/product/OrderSummary';
import { Skeleton } from '../components/ui/Feedback';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';
import { sizedImage } from '../lib/api';
import { formatPrice } from '../lib/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';

/** WooCommerce-style info notice: outlined box with an "i" icon. */
export function Notice({ children }) {
  return (
    <p className="flex items-center gap-4 border-2 border-[#5c8fd6] px-[26px] py-[15px] text-taupe dark:border-[#6f93c4]">
      <Info className="size-[22px] shrink-0 text-[#5c8fd6] dark:text-[#8fb0dc]" strokeWidth={1.5} />
      {children}
    </p>
  );
}

const th = 'py-4 text-left font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase';

export default function Cart() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.cart'));
  const { cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const unavailable = cart.items.some((i) => !i.isAvailable);

  return (
    <>
      <PageHero title={t('cartPage.title')} image={HERO_IMAGES.beauty} />
      <div className="container-luxe py-[150px] max-md:py-20">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : cart.items.length === 0 ? (
          <div>
            <Notice>{t('cartPage.empty')}</Notice>
            <Link to="/shop" className="btn-cos mt-[50px] px-[38px]">
              {t('cartPage.returnToShop')}
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead className="hidden border-b border-line md:table-header-group">
                <tr>
                  <th className={th} colSpan={3}>
                    {t('cartPage.product')}
                  </th>
                  <th className={th}>{t('cartPage.price')}</th>
                  <th className={th}>{t('cartPage.quantity')}</th>
                  <th className={`${th} text-right`}>{t('cartPage.subtotal')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {cart.items.map((item) => (
                    <motion.tr
                      key={item._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.3 } }}
                      className="grid grid-cols-[100px_1fr] items-center gap-x-5 border-b border-line py-6 md:table-row"
                    >
                      <td className="hidden w-10 md:table-cell">
                        <button
                          type="button"
                          onClick={() => remove.mutate({ itemId: item._id })}
                          aria-label={t('cart.remove', { name: item.product.name })}
                          className="group grid size-8 place-items-center text-ink transition-colors hover:text-rose"
                        >
                          <X className="size-4 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.5} />
                        </button>
                      </td>
                      <td className="row-span-3 md:w-[130px] md:py-6">
                        <Link to={`/product/${item.product.slug}`} className="relative block w-[100px] bg-beige">
                          <img
                            src={sizedImage(item.product.image, 240)}
                            alt={item.product.name}
                            className="aspect-[5/6] w-full object-cover"
                          />
                        </Link>
                      </td>
                      <td className="md:pr-6">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-serif text-xl leading-6 text-ink transition-colors hover:text-rose"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && <p className="mt-1 text-sm text-taupe">{item.variant.name}</p>}
                        {!item.isAvailable && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                            <AlertCircle className="size-3.5" /> {t('cartPage.onlyLeft', { count: item.availableStock })}
                          </p>
                        )}
                      </td>
                      <td className="font-bold text-rose md:w-[140px]">{formatPrice(item.unitPrice)}</td>
                      <td className="py-2 md:w-[200px]">
                        <QuantitySelector
                          size="sm"
                          value={item.quantity}
                          max={Math.max(item.availableStock, 1)}
                          onChange={(quantity) => update.mutate({ itemId: item._id, quantity })}
                        />
                      </td>
                      <td className="col-start-2 flex items-center justify-between font-bold text-ink md:table-cell md:text-right">
                        {formatPrice(item.subtotal)}
                        <button
                          type="button"
                          onClick={() => remove.mutate({ itemId: item._id })}
                          className="font-serif text-xs font-bold text-mute uppercase md:hidden"
                        >
                          {t('common.remove')}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <Link to="/shop" className="btn-cos">
                {t('common.continueShopping')}
              </Link>
              <button type="button" onClick={() => clear.mutate()} className="btn-cos">
                {t('cartPage.clear')}
              </button>
            </div>

            <div className="mt-[70px] ml-auto max-w-[470px]">
              <OrderSummary cart={cart}>
                {unavailable ? (
                  <p className="mt-4 text-center text-sm text-danger">{t('cart.unavailable')}</p>
                ) : (
                  <Link to="/checkout" className="btn-cos mt-4 w-full bg-ink text-white hover:bg-transparent hover:text-ink">
                    {t('common.proceedToCheckout')}
                  </Link>
                )}
              </OrderSummary>
            </div>
          </>
        )}
      </div>
    </>
  );
}
