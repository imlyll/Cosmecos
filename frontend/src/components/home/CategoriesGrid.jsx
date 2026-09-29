import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Reveal from '../ui/Reveal';

const CATEGORIES = [
  { key: 'concealer', image: '/images/category-1.jpg', to: '/shop?category=perfect-concealer' },
  { key: 'bodyCare', image: '/images/category-2.jpg', to: '/shop?category=body-care' },
  { key: 'equipment', image: '/images/category-3.jpg', to: '/shop?category=makeup-equipment' },
  { key: 'soap', image: '/images/category-4.jpg', to: '/shop?category=awesome-soap' },
];

/** Four tall framed category tiles with a caption box. */
export default function CategoriesGrid() {
  const { t } = useTranslation();
  return (
    <section className="grid gap-[30px] px-4 pt-[30px] sm:grid-cols-2 sm:px-[30px] lg:grid-cols-4">
      {CATEGORIES.map((c, i) => (
        <Reveal key={c.key} delay={i * 0.08}>
          <Link to={c.to} className="group relative block h-[420px] overflow-hidden lg:h-[592px]">
            <span
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-105"
              style={{ backgroundImage: `url(${c.image})` }}
            />
            <span className="frame-inset inset-[17px] group-hover:inset-[27px]" aria-hidden />
            <span className="absolute top-1/2 left-1/2 w-[216px] -translate-x-1/2 -translate-y-1/2 bg-white px-8 py-[15px] text-center font-serif text-xl leading-[30px] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white">
              {t(`home.categories.${c.key}`)}
            </span>
          </Link>
        </Reveal>
      ))}
    </section>
  );
}
