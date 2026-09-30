import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Reveal from '../ui/Reveal';
import { EASE } from '../../lib/motion';

/** Full-width "Nail polish / Make up accessories" promo with the −20% bubble. */
export default function PromoBanner() {
  const { t } = useTranslation();
  return (
    <section
      className="relative bg-[#e8e8ea] bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/home1-bg-9.jpg)' }}
    >
      <div className="container-luxe relative py-[130px] max-md:py-20">
        <div className="max-w-[580px]">
          <Reveal className="relative inline-block">
            <img src="/images/home1-bg-text-new.png" alt="" aria-hidden className="absolute inset-0 size-full" />
            <span className="relative block px-6 py-2 font-script text-[54px] leading-[1.3] text-white md:text-[70px]">
              {t('home.promo.script')}
            </span>
          </Reveal>
          <Reveal as="h2" delay={0.1} className="mt-3 text-[28px] leading-[1.47] font-light uppercase md:text-[38px]">
            {t('home.promo.title')}
          </Reveal>
          <Reveal as="p" delay={0.15} className="mt-4 text-taupe">
            {t('home.promo.text')}
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/shop" className="btn-cos mt-[70px] max-md:mt-10">
              {t('common.shopNow')}
            </Link>
          </Reveal>
        </div>
        <motion.span
          className="absolute top-[140px] left-[580px] hidden size-[110px] place-items-center rounded-full bg-[#f5b996] font-serif text-[40px] font-light text-white lg:grid"
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
        >
          {t('home.promo.badge')}
        </motion.span>
      </div>
    </section>
  );
}
