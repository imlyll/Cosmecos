import { AnimatePresence, LayoutGroup } from 'framer-motion';
import clsx from 'clsx';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../ui/Feedback';

export default function ProductGrid({ products = [], loading, columns = 4, skeletons = 8 }) {
  const cols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={clsx('grid gap-x-[30px] gap-y-[70px]', cols)}>
      {loading ? (
        Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
      ) : (
        <LayoutGroup>
          <AnimatePresence>
            {products.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      )}
    </div>
  );
}
