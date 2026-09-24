import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { useToggleWishlist, useWishlist } from '../../hooks/useWishlist';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function WishlistButton({ product, className, size = 'md' }) {
  const { has } = useWishlist();
  const toggle = useToggleWishlist();
  const requireAuth = useRequireAuth();
  const active = has(product._id);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => toggle.mutate({ product }));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={clsx(
        // Callers position it (absolute over a card, or relative inline); either anchors the burst ring.
        'grid place-items-center rounded-full text-ink transition-colors duration-300 hover:text-rose',
        size === 'md' ? 'size-8' : 'size-10',
        className
      )}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: 0.6 }}
        animate={{ scale: [0.6, 1.25, 1] }}
        transition={{ duration: 0.45 }}
        className="grid place-items-center"
      >
        <Heart
          className={clsx('transition-colors', size === 'md' ? 'size-5' : 'size-[22px]', active && 'fill-rose text-rose')}
          strokeWidth={1.5}
        />
      </motion.span>
      {/* burst ring on add */}
      <AnimatePresence>
        {active && (
          <motion.span
            key="burst"
            className="pointer-events-none absolute inset-0 rounded-full border border-rose"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}
