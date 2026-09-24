import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '../../lib/motion';

/*
 * Each slide mirrors the theme's layout at 1440px: a background, an optional
 * product picture pinned to one side (width as % of the slide) and a text block
 * whose width is a % of the 950px content column.
 */
const SLIDES = [
  {
    title: 'Perfect Cosmetic',
    text: 'Popularized through customer relationships with some of the world’s most recognizable faces, the “brow revolution” she ignited has become a landmark',
    cta: 'Discover',
    // The theme drops this background below 992px, where it would sit under the text.
    bg: { image: '/images/home1-slide1-bg.jpg', size: 'contain', position: 'left center', color: '#fbf9f7', desktopOnly: true },
    picture: { src: '/images/home1-slide1-img.png', side: 'right', width: '46.3%' },
    textWidth: '50%',
    enterFrom: 40,
  },
  {
    title: 'Your Perfect Cosmetic',
    text: 'Popularized through customer relationships with some of the world’s most recognizable faces, the “brow revolution” she ignited has become a color makeup line on history.',
    cta: 'Read More',
    bg: { color: '#ffffff' },
    picture: { src: '/images/home1-slide2-img1-2.jpg', side: 'right', width: '47.8%' },
    textWidth: '60%',
    enterFrom: 40,
  },
  {
    title: 'Change the World',
    text: 'Electric ray demoiselle squeaker unicorn fish Kafue pike bango temperate ocean-bass, yellow bass coffinfish yellowfin customers.',
    cta: 'Read More',
    bg: { image: '/images/home1-slide5-bg-2.jpg', size: 'cover', position: 'bottom center', color: '#fffaf7' },
    picture: { src: '/images/home1-slide5-img1-2.png', side: 'left', width: '36.4%' },
    textWidth: '64%',
    align: 'end',
    enterFrom: -40,
  },
  {
    title: 'Find Your Beaute Match',
    text: 'Popularized through customer relationships with some of the world’s most recognizable faces, the “brow revolution” she ignited has become a landmark contribution to beauty history. Its new color makeup line on history.',
    cta: 'View More',
    bg: { image: '/images/home1-slide4-bg-2.jpg', size: 'cover', position: 'center', color: '#ffffff' },
    textWidth: '66%',
    enterFrom: 40,
  },
];

const AUTOPLAY_MS = 7000;

function Slide({ slide }) {
  const { bg, picture } = slide;
  return (
    <motion.div
      className={`absolute inset-0 ${bg.desktopOnly ? 'max-lg:bg-none!' : ''}`}
      style={{
        backgroundColor: bg.color,
        backgroundImage: bg.image ? `url(${bg.image})` : undefined,
        backgroundSize: bg.size,
        backgroundPosition: bg.position,
        backgroundRepeat: 'no-repeat',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeInOut' }}
    >
      {picture && (
        <motion.div
          className="absolute inset-y-0 hidden overflow-hidden lg:block"
          style={{ width: picture.width, [picture.side]: 0 }}
          initial={{ opacity: 0, x: picture.side === 'right' ? 80 : -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
        >
          <img
            src={picture.src}
            alt=""
            className={`absolute top-0 h-full w-auto max-w-none ${picture.side === 'right' ? 'left-0' : 'right-0'}`}
          />
        </motion.div>
      )}

      <div className="relative mx-auto flex h-full max-w-[1200px] items-center px-6 lg:px-[125px]">
        <div
          className={`w-full lg:w-[var(--w)] ${slide.align === 'end' ? 'lg:ml-auto' : ''}`}
          style={{ '--w': slide.textWidth }}
        >
          <motion.h2
            className="mt-1.5 text-[32px] leading-[1.2] font-extralight text-ink md:text-[56px] lg:text-[80px]"
            initial={{ opacity: 0, x: slide.enterFrom }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.35 }}
          >
            {slide.title}
          </motion.h2>
          <motion.p
            className="pt-5 text-base leading-[1.9] text-body md:text-lg"
            initial={{ opacity: 0, x: slide.enterFrom }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.5 }}
          >
            {slide.text}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
          >
            <Link to="/shop" className="btn-cos mt-10">
              {slide.cta}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/** Vertical white tab on the slider edge ("PREVIOUS" / "NEXT"). */
function Arrow({ side, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group absolute top-1/2 z-10 hidden h-[120px] w-[45px] -translate-y-1/2 overflow-hidden bg-white font-serif text-[13px] font-bold text-ink uppercase md:block ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <span
        className={`absolute inset-0 origin-bottom scale-y-0 bg-ink transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:scale-y-100`}
        aria-hidden
      />
      <span
        className={`relative block whitespace-nowrap transition-colors duration-300 group-hover:text-white ${
          side === 'left' ? 'rotate-90' : '-rotate-90'
        }`}
      >
        {children}
      </span>
    </button>
  );
}

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((dir) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return undefined;
    const id = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [index, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative h-[500px] overflow-hidden bg-[#fbf9f7] lg:h-[810px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <Slide key={index} slide={SLIDES[index]} />
      </AnimatePresence>
      <Arrow side="left" onClick={() => go(-1)}>
        Previous
      </Arrow>
      <Arrow side="right" onClick={() => go(1)}>
        Next
      </Arrow>
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3 md:hidden">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === index}
            className={`size-2 rounded-full ${i === index ? 'bg-ink' : 'bg-ink/25'}`}
          />
        ))}
      </div>
    </section>
  );
}
