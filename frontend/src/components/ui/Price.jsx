import clsx from 'clsx';
import { formatPrice } from '../../lib/format';

/** Peach current price, with the struck-through original in grey when on sale. */
export default function Price({ price, compareAtPrice, from = false, className, large = false }) {
  const onSale = compareAtPrice && compareAtPrice > price;
  return (
    <div className={clsx('flex items-baseline gap-2 font-sans font-bold', large ? 'text-xl' : 'text-sm', className)}>
      {from && <span className="text-xs font-normal text-mute">From</span>}
      {onSale && (
        <del className={clsx('text-mute', large ? 'text-xl' : 'text-sm')}>{formatPrice(compareAtPrice)}</del>
      )}
      <span className="text-rose">{formatPrice(price)}</span>
    </div>
  );
}
