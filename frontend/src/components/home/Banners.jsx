import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Framed from '../ui/Framed';
import Reveal from '../ui/Reveal';

const BANNERS = [
  { key: 'body', image: '/images/home1-banner-1-2.jpg', scriptColor: '#ffe5d5', titleColor: '#ffffff', to: '/shop?category=body-care' },
  { key: 'cosmetics', image: '/images/home1-banner-2-2.jpg', scriptColor: '#f7bb98', titleColor: '#1c1c1c', to: '/shop?category=cosmetics' },
  { key: 'nails', image: '/images/home1-banner-3-2.jpg', scriptColor: '#e3cbbb', titleColor: '#1c1c1c', to: '/shop' },
];

/** Three framed category banners under the hero. */
export default function Banners() {
  const { t } = useTranslation();
  return (
    <section className="mt-[31px] grid gap-[30px] px-4 sm:px-[30px] md:grid-cols-3">
      {BANNERS.map((b, i) => (
        <Reveal key={b.key} delay={i * 0.1}>
          <Framed frameClassName="group-hover/frame:translate-x-5 group-hover/frame:translate-y-5">
            <Link to={b.to} className="group relative block h-[200px] overflow-hidden lg:h-[360px]">
              <span
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-105"
                style={{ backgroundImage: `url(${b.image})` }}
              />
              <span className="absolute inset-x-0 bottom-0 px-[48px] py-[60px] max-lg:py-8">
                <span
                  className="block font-script text-[70px] leading-[1.15] lg:text-[100px]"
                  style={{ color: b.scriptColor }}
                >
                  {t(`home.banners.${b.key}.script`)}
                </span>
                <span className="block font-serif text-2xl leading-9 font-medium" style={{ color: b.titleColor }}>
                  {t(`home.banners.${b.key}.title`)}
                </span>
              </span>
            </Link>
          </Framed>
        </Reveal>
      ))}
    </section>
  );
}
