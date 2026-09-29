import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import SectionHeading from '../ui/SectionHeading';
import ProductGrid from '../product/ProductGrid';
import { useProducts } from '../../hooks/useCatalog';

export default function BestSellers() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({ sort: 'best_selling', limit: 8 });
  return (
    <section className="container-luxe pt-[150px] pb-[120px] max-md:pt-20 max-md:pb-16">
      <SectionHeading
        eyebrow={t('home.bestSellers.eyebrow')}
        title={t('home.bestSellers.title')}
        subtitle={t('home.bestSellers.subtitle')}
      />
      <ProductGrid products={data?.products} loading={isLoading} columns={4} skeletons={8} />
      <div className="mt-[70px] text-center">
        <Link to="/shop" className="btn-cos">
          {t('common.exploreMore')}
        </Link>
      </div>
    </section>
  );
}
