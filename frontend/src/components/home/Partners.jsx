import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Reveal from '../ui/Reveal';

export const PARTNERS_BROWN = [1, 2, 3, 4, 5, 6].map((n) => `/images/partner-logo-${n}-brown-2.png`);
export const PARTNERS_BLACK = [1, 2, 3, 4].map((n) => `/images/partner-logo-${n}-black-2.png`);

/** Row of partner logos; on the home page it sits on a pale marble band. */
export default function Partners({ logos = PARTNERS_BROWN, band = true, className }) {
  const { t } = useTranslation();
  return (
    <section
      className={clsx(band && 'bg-cover bg-center', className)}
      style={band ? { backgroundImage: 'url(/images/home1-bg-2.jpg)' } : undefined}
    >
      <div
        className={clsx(
          'mx-auto grid max-w-[1440px] grid-cols-2 items-center gap-x-6 gap-y-10 px-6 sm:grid-cols-3',
          band ? 'py-[60px] lg:grid-cols-6 lg:px-[60px]' : 'container-luxe py-10 lg:grid-cols-4'
        )}
      >
        {logos.map((src, i) => (
          <Reveal key={src} delay={i * 0.06} className="flex justify-center">
            <img
              src={src}
              alt={t('a11y.partnerLogo')}
              loading="lazy"
              className={clsx(
                'max-h-[130px] w-auto max-w-full transition-opacity duration-300',
                band ? 'opacity-60 hover:opacity-100' : 'hover:opacity-60'
              )}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
