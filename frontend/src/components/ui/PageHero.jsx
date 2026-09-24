import { motion } from 'framer-motion';
import { EASE } from '../../lib/motion';

export const HERO_IMAGES = {
  // Woman with a brush: shop, cart and checkout
  beauty: '/images/page-title-pic4.jpg',
  // Sponge and nail polish: about, product, contacts, wishlist…
  polish: '/images/home1-bg-9.jpg',
};

/**
 * Title banner at the top of inner pages: photo background, script subtitle,
 * a thin 80px title and the oversized "Beauty" lettering along the bottom.
 * `crumbs` is accepted for API compatibility; the theme shows no breadcrumbs.
 */
export default function PageHero({ title, subtitle = 'Organic Cosmetic', image = HERO_IMAGES.polish, decoration = true }) {
  return (
    <section className="relative flex h-[300px] items-center overflow-hidden bg-beige md:h-[499px]">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: EASE }}
      />
      <div className="container-luxe relative">
        <motion.p
          className="mb-1 pl-2 font-script text-[28px] leading-[30px] text-rose md:mb-3 md:text-[35px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {subtitle}
        </motion.p>
        <motion.h1
          className="max-w-[60%] text-[40px] leading-[1.2] font-extralight text-ink sm:text-[56px] md:text-[80px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        >
          {title}
        </motion.h1>
      </div>
      {decoration && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-[-40px] left-[42%] font-script text-[110px] leading-[220px] whitespace-nowrap text-sand select-none md:-bottom-[84px] md:left-[50%] md:text-[200px]"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        >
          Beauty
        </motion.span>
      )}
    </section>
  );
}
