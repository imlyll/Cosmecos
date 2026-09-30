import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck } from 'lucide-react';
import clsx from 'clsx';
import PageHero from '../components/ui/PageHero';
import ProductGallery from '../components/product/ProductGallery';
import WishlistButton from '../components/product/WishlistButton';
import ProductGrid from '../components/product/ProductGrid';
import QuantitySelector from '../components/ui/QuantitySelector';
import Rating from '../components/ui/Rating';
import Price from '../components/ui/Price';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { useProduct } from '../hooks/useCatalog';
import { useAddToCart } from '../hooks/useCart';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EASE, fadeUp, stagger } from '../lib/motion';
import { Trans, useTranslation } from 'react-i18next';

function DetailsSkeleton() {
  return (
    <>
      <Skeleton className="h-[300px] md:h-[499px]" />
      <div className="container-luxe grid gap-[70px] py-[150px] lg:grid-cols-[549px_1fr]">
        <Skeleton className="aspect-square" />
        <div className="space-y-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-14 w-2/3" />
        </div>
      </div>
    </>
  );
}

/** Description text where lines starting with "- " become a peach-ticked checklist. */
function Description({ text }) {
  const lines = text.split('\n').filter(Boolean);
  const paragraphs = lines.filter((l) => !l.startsWith('- '));
  const bullets = lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  return (
    <div className="max-w-[870px]">
      {paragraphs.map((p) => (
        <p key={p} className="mb-5 text-taupe">
          {p}
        </p>
      ))}
      {bullets.length > 0 && (
        <ul className="space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 font-medium text-body">
              <CircleCheck className="size-[18px] shrink-0 fill-rose text-white" strokeWidth={2} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center gap-1.5 font-serif text-[13px] leading-8 text-ink uppercase">
      <dt className="font-semibold">{label}:</dt>
      <dd className="text-taupe">{children}</dd>
    </div>
  );
}

export default function ProductDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { data, isLoading, isError } = useProduct(slug);
  const product = data?.product;
  const related = data?.related || [];

  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const addToCart = useAddToCart();
  const requireAuth = useRequireAuth();
  useDocumentTitle(product?.name);

  // Preselect the first in-stock variant whenever the product changes.
  useEffect(() => {
    setQuantity(1);
    setTab('description');
    if (product?.variants?.length) {
      setVariantId((product.variants.find((v) => v.stock > 0) || product.variants[0])._id);
    } else {
      setVariantId(null);
    }
  }, [product?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const variant = product?.variants?.find((v) => v._id === variantId) || null;

  const images = useMemo(() => {
    if (!product) return [];
    const list = [...product.images];
    if (variant?.image && !list.some((i) => i.url === variant.image)) list.unshift({ url: variant.image, alt: variant.name });
    return list;
  }, [product, variant]);

  if (isLoading) return <DetailsSkeleton />;
  if (isError || !product) {
    return (
      <div className="container-luxe">
        <EmptyState title={t('product.notFoundTitle')} text={t('product.notFoundText')} action={t('product.backToShop')} to="/shop" />
      </div>
    );
  }

  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock : product.stock;
  const soldOut = stock <= 0;
  const onSale = !variant && product.compareAtPrice > product.price;
  const swatches = product.variants?.some((v) => v.colorHex);
  const extraInfo = [
    [t('product.weight'), product.weight],
    [t('product.dimensions'), product.dimensions],
    ...(product.ingredients ? [[t('product.ingredients'), product.ingredients]] : []),
  ].filter(([, v]) => v);

  const handleAdd = () =>
    requireAuth(() =>
      addToCart.mutate(
        { productId: product._id, variantId: variant?._id, quantity, name: product.name },
        { onSuccess: () => setQuantity(1) }
      )
    );

  const tabs = [
    { id: 'description', label: t('product.description') },
    { id: 'reviews', label: t('product.reviews', { count: product.numReviews || 0 }) },
  ];

  return (
    <>
      <PageHero title={product.name} decoration={false} />

      <section className="container-luxe grid gap-[70px] pt-[150px] max-md:pt-20 lg:grid-cols-[549px_1fr]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <ProductGallery
            key={product._id}
            images={images}
            name={product.name}
            badge={
              (onSale || soldOut) && (
                <span className="absolute top-[37px] left-[5px] bg-ink-soft px-3 font-serif text-[13px] leading-[30px] font-medium text-white uppercase">
                  {soldOut ? t('common.soldOut') : t('common.sale')}
                </span>
              )
            }
          />
        </motion.div>

        <motion.div variants={stagger(0.08, 0.15)} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <Price price={price} compareAtPrice={variant ? undefined : product.compareAtPrice} large className="font-normal" />
          </motion.div>
          <motion.div variants={fadeUp} className="mt-2.5">
            <Rating value={product.rating || 0} size="md" />
          </motion.div>
          {product.shortDescription && (
            <motion.div variants={fadeUp} className="mt-6 space-y-5 text-taupe">
              {product.shortDescription.split(/\n+/).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </motion.div>
          )}

          <motion.dl variants={fadeUp} className="mt-9">
            {(variant?.sku || product.sku) && <MetaRow label={t('product.sku')}>{variant?.sku || product.sku}</MetaRow>}
            {product.category && (
              <MetaRow label={t('product.category')}>
                <Link to={`/shop?category=${product.category.slug}`} className="transition-colors hover:text-rose">
                  {product.category.name}
                </Link>
              </MetaRow>
            )}
            <MetaRow label={t('product.availability')}>
              <span className={soldOut ? 'text-danger' : 'text-success'}>
                {soldOut ? t('common.outOfStock') : t('common.inStock')}
              </span>
            </MetaRow>
            {product.tags?.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2.5 font-serif text-[13px] font-semibold text-ink uppercase">
                <dt>{t('product.tags')}:</dt>
                {product.tags.map((t) => (
                  <dd key={t}>
                    <Link
                      to={`/shop?tags=${encodeURIComponent(t)}`}
                      className="block border border-ink px-[9px] py-[3px] text-base leading-[22px] font-medium capitalize transition-colors hover:bg-ink hover:text-white"
                    >
                      {t}
                    </Link>
                  </dd>
                ))}
              </div>
            )}
          </motion.dl>

          {product.variants?.length > 0 && (
            <motion.div variants={fadeUp} className="mt-8">
              <p className="label-luxe">
                {swatches ? t('product.shade') : t('product.size')}: <span className="font-medium text-taupe">{variant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={swatches ? t('product.shade') : t('product.size')}>
                {product.variants.map((v) => {
                  const active = v._id === variantId;
                  const out = v.stock <= 0;
                  return swatches ? (
                    <button
                      key={v._id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={out ? t('product.soldOutOption', { name: v.name }) : v.name}
                      title={v.name}
                      onClick={() => setVariantId(v._id)}
                      className={clsx(
                        'relative size-10 rounded-full ring-offset-2 ring-offset-white transition-all duration-300',
                        active ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-taupe',
                        out && 'opacity-40'
                      )}
                      style={{ backgroundColor: v.colorHex }}
                    >
                      {out && <span className="absolute inset-x-1 top-1/2 h-px -rotate-45 bg-white" />}
                    </button>
                  ) : (
                    <button
                      key={v._id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVariantId(v._id)}
                      className={clsx(
                        'h-10 min-w-16 border px-4 font-serif text-[13px] font-bold uppercase transition-colors duration-300',
                        active ? 'border-ink bg-ink text-white' : 'border-ink bg-white text-ink hover:bg-ink hover:text-white',
                        out && 'line-through opacity-50'
                      )}
                    >
                      {v.size || v.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {!soldOut && stock <= 5 && (
            <motion.p variants={fadeUp} className="mt-6 text-sm text-danger">
              {t('product.onlyLeft', { count: stock })}
            </motion.p>
          )}

          <motion.div variants={fadeUp} className="mt-[45px] flex flex-wrap items-start gap-x-[33px] gap-y-4">
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, stock)} disabled={soldOut} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut || addToCart.isPending}
              className="btn-cos w-[185px] px-4"
            >
              {soldOut ? t('common.outOfStock') : addToCart.isPending ? t('common.adding') : t('common.addToCart')}
            </button>
            <WishlistButton product={product} size="lg" className="relative -mt-1" />
          </motion.div>
        </motion.div>
      </section>

      {/* Description / reviews tabs */}
      <section className="container-luxe pt-[100px] max-md:pt-16">
        <div role="tablist" aria-label={t('a11y.productInfo')} className="flex">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                '-ml-px h-14 w-[188px] border border-ink font-serif text-[13px] font-bold tracking-[0.05em] uppercase transition-colors duration-300 first:ml-0',
                tab === item.id ? 'bg-ink text-white' : 'text-ink hover:bg-ink hover:text-white'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            role="tabpanel"
            className="pt-[60px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {tab === 'description' ? (
              <>
                <Description text={product.description} />
                {product.howToUse && (
                  <div className="mt-10 max-w-[870px]">
                    <h3 className="label-luxe">{t('product.howToUse')}</h3>
                    <p className="whitespace-pre-line text-taupe">{product.howToUse}</p>
                  </div>
                )}
                {extraInfo.length > 0 && (
                  <table className="mt-10 w-full max-w-[368px] text-left">
                    <tbody>
                      {extraInfo.map(([k, v], i) => (
                        <tr key={k} className={i % 2 === 0 ? 'bg-beige' : ''}>
                          <th className="w-[214px] px-8 py-0.5 align-top font-sans font-normal text-body uppercase">{k}</th>
                          <td className="py-0.5 pr-4 text-body">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div className="max-w-[870px]">
                {product.numReviews > 0 ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <Rating value={product.rating || 0} size="md" />
                    <p className="text-taupe">
                      <Trans
                        i18nKey="product.rated"
                        count={product.numReviews}
                        values={{ rating: (product.rating || 0).toFixed(2) }}
                        components={{ strong: <span className="font-bold text-ink" /> }}
                      />
                    </p>
                  </div>
                ) : (
                  <p className="text-taupe">{t('product.noReviews')}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {related.length > 0 && (
        <section className="container-luxe pt-[150px] pb-[120px] max-md:py-20">
          <h2 className="mb-10 text-[28px] leading-[1.47] font-light uppercase md:text-[38px]">{t('product.related')}</h2>
          <ProductGrid products={related.slice(0, 4)} columns={4} />
        </section>
      )}
    </>
  );
}
