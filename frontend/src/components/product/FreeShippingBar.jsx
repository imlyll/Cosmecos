import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { EASE } from '../../lib/motion';

export default function FreeShippingBar({ remaining = 0, threshold = 100 }) {
  const progress = Math.min(100, ((threshold - remaining) / threshold) * 100);
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-taupe">
        <Truck className="size-4 text-rose" strokeWidth={1.5} />
        {remaining > 0 ? (
          <span>
            Add <strong className="font-bold text-ink">{formatPrice(remaining)}</strong> more for free shipping
          </span>
        ) : (
          <span className="text-ink">You’ve unlocked free shipping</span>
        )}
      </p>
      <div className="mt-3 h-[3px] w-full overflow-hidden bg-line">
        <motion.div
          className="h-full bg-rose"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: EASE }}
        />
      </div>
    </div>
  );
}
