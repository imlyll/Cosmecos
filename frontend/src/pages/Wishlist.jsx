import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import i18n from '../i18n';
import PageHero from '../components/ui/PageHero';
import Price from '../components/ui/Price';
import Rating from '../components/ui/Rating';
import { ProductCardSkeleton } from '../components/ui/Feedback';
import { useToggleWishlist, useWishlist } from '../hooks/useWishlist';
import { useAddToCart } from '../hooks/useCart';
import { sizedImage } from '../lib/api';
import { priceRange } from '../lib/format';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** First purchasable option: the product itself, or its first in-stock variant. */
function pickVariant(product) {
  if (!product.variants?.length) return product.stock > 0 ? { ok: true } : { ok: false };
  const v = product.variants.find((x) => x.stock > 0);
  return v ? { ok: true, variant: v } : { ok: false };
}

function WishlistItem({ product, index }) {
  const toggle = useToggleWishlist();
  const addToCart = useAddToCart();
  const { ok, variant } = pickVariant(product);
  const { min, max } = priceRange(product);

  const moveToCart = () => {
    addToCart.mutate(
      { productId: product._id, variantId: variant?._id, quantity: 1, name: product.name },
      {
        onSuccess: () => {
          toggle.mutate({ product, silent: true });
          if (variant) toast(i18n.t('toast.addedInVariant', { variant: variant.name }));
        },
      }
    );
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.05 }}
      className="group flex flex-col"
    >
      <div className="relative aspect-[5/6] overflow-hidden bg-beige">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img
            src={sizedImage(product.images?.[0]?.url, 700)}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-105"
          />
        </Link>
        <span className="frame-inset" aria-hidden />
        <button
          type="button"
          onClick={() => toggle.mutate({ product })}
          aria-label={`Remove ${product.name} from wishlist`}
          className="group/x absolute top-[26px] right-[26px] z-10 grid size-9 place-items-center bg-white transition-colors hover:bg-ink hover:text-white"
        >
          <X className="size-4 transition-transform duration-500 group-hover/x:rotate-90" />
        </button>
      </div>
      <div className="flex flex-1 flex-col pt-8 text-center">
        <Rating value={product.rating || 0} className="justify-center" />
        <Link to={`/product/${product.slug}`} className="mt-[19px] font-serif text-xl leading-6 text-ink hover:text-rose">
          {product.name}
        </Link>
        <Price price={min} compareAtPrice={product.variants?.length ? undefined : product.compareAtPrice} from={min !== max} className="mt-2 justify-center" />
        <button type="button" onClick={moveToCart} disabled={!ok || addToCart.isPending} className="btn-cos mt-[26px] w-full">
          {!ok ? 'Out of stock' : addToCart.isPending ? 'Adding…' : 'Move to cart'}
        </button>
      </div>
    </motion.li>
  );
}

export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const { products, isLoading } = useWishlist();

  return (
    <>
      <PageHero title="Shop Wishlist" decoration={false} />
      <div className="container-luxe py-[150px] max-md:py-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-lg text-body">No products added to the wishlist</p>
        ) : (
          <>
            <p className="mb-12 text-center font-serif text-sm font-bold tracking-[0.05em] text-ink uppercase">
              {products.length} saved item{products.length === 1 ? '' : 's'}
            </p>
            <ul className="grid gap-x-[30px] gap-y-[70px] sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence>
                {products.map((p, i) => (
                  <WishlistItem key={p._id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </div>
    </>
  );
}
