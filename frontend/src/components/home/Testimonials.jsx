import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import Reveal from '../ui/Reveal';
import { EASE } from '../../lib/motion';

const QUOTES = [
  {
    text: 'Brows should begin directly above the middle of your nostrils. The highest point of the arch should connect the tip of the nose with the middle of the iris. Brows should end where the corner of the nostril connects with the outer corner of the eye.',
    name: 'Samantha Peterson',
  },
  {
    text: 'Popularized through customer relationships with some of the world’s most recognizable faces, the brow revolution has become a landmark contribution to beauty history. I can’t imagine my morning routine without it.',
    name: 'Julia Morgan',
  },
  {
    text: 'Our eyes are intrinsically trained to spot divine proportion and immediately associate it with beauty and harmony. These products bring exactly that balance to my skin.',
    name: 'Emily Watson',
  },
];

/** Framed speech-bubble card over the cotton photo, cycling through client quotes. */
export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % QUOTES.length), 8000);
    return () => clearTimeout(id);
  }, [index]);

  const quote = QUOTES[index];

  return (
    <section
      className="bg-[#e9e9e9] bg-cover bg-right py-[100px] max-md:py-16"
      style={{ backgroundImage: 'url(/images/home1-bg-8.jpg)' }}
    >
      <div className="container-luxe">
        <Reveal className="relative max-w-[972px] bg-white p-4 sm:p-[30px]">
          <div className="relative border border-ink px-6 pt-16 pb-14 sm:px-[75px]">
            {/* speech bubble tail */}
            <svg
              aria-hidden
              className="absolute -bottom-[33px] left-[81px] h-[33px] w-[48px] text-ink"
              viewBox="0 0 48 33"
              fill="none"
            >
              <path d="M0.5 0V32L46.5 0" fill="white" stroke="currentColor" />
            </svg>
            <span
              aria-hidden
              className="pointer-events-none absolute top-9 left-4 font-script text-[180px] leading-none text-nude select-none sm:left-5"
            >
              “
            </span>
            <p className="relative font-script text-[35px] leading-[1.6] text-rose">Testimonials</p>
            <h2 className="relative text-[28px] leading-[1.47] font-light uppercase md:text-[38px]">
              What our clients say
            </h2>
            <div className="relative mt-5 min-h-[240px] sm:min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.figure
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <blockquote className="text-lg leading-10 font-light text-taupe md:text-xl">“{quote.text}”</blockquote>
                  <figcaption className="mt-5">
                    <p className="font-serif text-xl text-ink">{quote.name}</p>
                    <p className="font-serif text-sm font-bold text-rose uppercase">Client of Cosmecos</p>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex items-center gap-3">
              {QUOTES.map((q, i) => (
                <button
                  key={q.name}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  aria-current={i === index}
                  className={clsx(
                    'grid size-[21px] place-items-center rounded-full border transition-colors',
                    i === index ? 'border-ink' : 'border-transparent'
                  )}
                >
                  <span className="size-[5px] rounded-full bg-ink" />
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
