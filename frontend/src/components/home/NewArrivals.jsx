import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { Skeleton } from '../ui/Feedback';
import MiniProduct from '../product/MiniProduct';
import { useProducts } from '../../hooks/useCatalog';

export default function NewArrivals() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({ featured: true, sort: 'best_selling', limit: 6 });
  const products = data?.products || [];

  return (
    <section className="container-luxe pt-[150px] pb-[120px] max-md:py-20">
      <SectionHeading eyebrow={t('home.newArrivals.eyebrow')} title={t('home.newArrivals.title')} />
      <div className="grid gap-[30px] lg:grid-cols-[1fr_370px]">
        <div className="grid content-start gap-x-[30px] gap-y-[30px] sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[159px]" />)
            : products.map((p, i) => (
                <Reveal key={p._id} delay={(i % 2) * 0.08}>
                  <MiniProduct product={p} />
                </Reveal>
              ))}
        </div>
        <Reveal className="hidden lg:block">
          <Link to="/shop" className="group block h-full overflow-hidden">
            <img
              src="/images/home1-image-2.jpg"
              alt={t('home.newArrivals.imageAlt')}
              className="size-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
          </Link>
        </Reveal>
      </div>
      <div className="mt-[70px] text-center">
        <Link to="/shop" className="btn-cos">
          {t('common.exploreMore')}
        </Link>
      </div>
    </section>
  );
}
