import { Link } from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import WishlistButton from './WishlistButton';
import Rating from '../ui/Rating';
import Price from '../ui/Price';
import { sizedImage } from '../../lib/api';
import { priceRange } from '../../lib/format';
import { EASE } from '../../lib/motion';
import { useAddToCart } from '../../hooks/useCart';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useTranslation } from 'react-i18next';

/** Grey product shot with the theme's thin inset frame and a "SALE" tag. */
export function ProductImage({ product, to, size = 700, className, badge = true }) {
  const { t } = useTranslation();
  const [primary, secondary] = product.images || [];
  const onSale = product.compareAtPrice > product.price;
  return (
    <div className={clsx('group/img relative aspect-[5/6] overflow-hidden bg-beige', className)}>
      <Link to={to} aria-label={product.name} className="absolute inset-0">
        {primary && (
          <img
            src={sizedImage(primary.url, size)}
            alt={primary.alt || product.name}
            loading="lazy"
            className={clsx(
              'absolute inset-0 size-full object-cover transition-all duration-700 ease-[var(--ease-luxe)] group-hover/img:scale-105',
              secondary && 'group-hover/img:opacity-0'
            )}
          />
        )}
        {secondary && (
          <img
            src={sizedImage(secondary.url, size)}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover/img:opacity-100"
          />
        )}
      </Link>
      <span className="frame-inset group-hover/img:inset-[22px]" aria-hidden />
      {badge && (onSale || !product.inStock) && (
        <span className="pointer-events-none absolute top-[25px] left-0 bg-ink-soft px-3 font-serif text-[13px] leading-[30px] font-medium text-white uppercase">
          {product.inStock ? t('common.sale') : t('common.soldOut')}
        </span>
      )}
    </div>
  );
}

/** "ADD TO CART | $price" button row that sits under every product. */
export function CartRow({ product, className }) {
  const { t } = useTranslation();
  const addToCart = useAddToCart();
  const requireAuth = useRequireAuth();
  const hasVariants = product.variants?.length > 0;
  const { min, max } = priceRange(product);
  const url = `/product/${product.slug}`;
  const cell =
    'flex h-14 items-center justify-center border border-ink px-2.5 font-serif text-[13px] leading-4 font-bold text-ink uppercase transition-colors duration-300';

  const handleAdd = () => requireAuth(() => addToCart.mutate({ productId: product._id, name: product.name }));

  return (
    <div className={clsx('flex', className)}>
      {!product.inStock ? (
        <Link to={url} className={clsx(cell, 'w-[49%] shrink-0 hover:bg-ink hover:text-white')}>
          {t('common.readMore')}
        </Link>
      ) : hasVariants ? (
        <Link to={url} className={clsx(cell, 'w-[49%] shrink-0 hover:bg-ink hover:text-white')}>
          {t('common.selectOptions')}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={addToCart.isPending}
          className={clsx(cell, 'w-[49%] shrink-0 hover:bg-ink hover:text-white disabled:opacity-60')}
        >
          {addToCart.isPending ? t('common.adding') : t('common.addToCart')}
        </button>
      )}
      <Price
        price={min}
        compareAtPrice={hasVariants ? undefined : product.compareAtPrice}
        from={hasVariants && min !== max}
        className={clsx(cell, '-ml-px flex-1 gap-1.5 px-[15px]')}
      />
    </div>
  );
}

export default function ProductCard({ product, index = 0, className }) {
  const url = `/product/${product.slug}`;

  return (
    <motion.article
      layout
      className={clsx('group relative', className)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE, delay: (index % 4) * 0.08 }}
    >
      <div className="relative">
        <ProductImage product={product} to={url} />
        <WishlistButton
          product={product}
          className="absolute top-[26px] right-[26px] transition-all duration-500 lg:opacity-0 lg:group-hover:opacity-100 [&[aria-pressed=true]]:opacity-100"
        />
      </div>

      <div className="pt-8 text-center">
        <Rating value={product.rating || 0} className="justify-center" />
        <h3 className="mt-[19px] text-xl leading-6 font-normal">
          <Link to={url} className="transition-colors duration-300 hover:text-rose">
            {product.name}
          </Link>
        </h3>
      </div>
      <CartRow product={product} className="mt-[26px]" />
    </motion.article>
  );
}
