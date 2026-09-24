import { Link } from 'react-router';
import Rating from '../ui/Rating';
import Price from '../ui/Price';
import { sizedImage } from '../../lib/api';

/** Compact product row: small framed thumbnail, name, price and stars. */
export default function MiniProduct({ product, size = 'md' }) {
  const url = `/product/${product.slug}`;
  const image = product.images?.[0];
  const small = size === 'sm';
  return (
    <div className="flex items-center gap-[30px]">
      <Link
        to={url}
        className={`group relative block shrink-0 overflow-hidden bg-beige ${small ? 'h-[70px] w-[70px]' : 'h-[159px] w-[133px]'}`}
      >
        {image && (
          <img
            src={sizedImage(image.url, 300)}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {!small && <span className="frame-inset inset-[10px] group-hover:inset-[14px]" aria-hidden />}
      </Link>
      <div>
        <Link to={url} className={`font-serif leading-6 text-ink transition-colors hover:text-rose ${small ? 'text-base' : 'text-xl'}`}>
          {product.name}
        </Link>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} className="mt-1.5" />
        <Rating value={product.rating || 0} className="mt-2" />
      </div>
    </div>
  );
}
