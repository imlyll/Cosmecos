import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Reveal from '../ui/Reveal';

/** Huge faint script word placed behind a block. */
function Watermark({ children, className }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute font-script text-[150px] leading-none whitespace-nowrap text-sand select-none md:text-[240px] ${className}`}
    >
      {children}
    </span>
  );
}

function Heading({ children }) {
  const { t } = useTranslation();
  return (
    <>
      <Reveal as="p" className="eyebrow">
        {t('home.spotlights.eyebrow')}
      </Reveal>
      <Reveal
        as="h2"
        delay={0.08}
        className="relative text-[28px] leading-[1.47] font-light uppercase md:text-[38px] md:leading-[56px]"
      >
        {children}
      </Reveal>
    </>
  );
}

/** Two alternating text + picture rows: "Eyeshadow revolution" and "Foundations & blushes". */
export default function Spotlights() {
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden pt-[150px] pb-[120px] max-md:py-20">
      <div className="container-luxe grid items-center gap-12 lg:grid-cols-[520px_1fr] lg:gap-[85px]">
        <div className="relative z-10">
          <Heading>{t('home.spotlights.eyeshadowTitle')}</Heading>
          <Reveal as="p" delay={0.12} className="mt-6 font-bold text-ink">
            {t('home.spotlights.eyeshadowLead')}
          </Reveal>
          <Reveal as="p" delay={0.16} className="mt-5 text-taupe">
            {t('home.spotlights.eyeshadowText')}
          </Reveal>
          <Reveal delay={0.2} className="mt-9 flex items-center gap-6">
            <img src="/images/avatar-2.jpg" alt="Ann Gray" className="size-[75px] rounded-full object-cover" />
            <div>
              <p className="font-serif text-xl leading-7 text-ink">Ann Gray</p>
              <p className="font-serif text-sm font-bold text-mute uppercase">{t('home.spotlights.founder')}</p>
            </div>
            <img src="/images/sign-2.png" alt="" aria-hidden className="h-[60px] w-auto dark:invert" />
          </Reveal>
        </div>
        <Reveal className="relative">
          <img src="/images/team-image-1.jpg" alt={t('home.spotlights.paletteAlt')} className="relative ml-auto w-full max-w-[560px]" />
          <Watermark className="-top-16 -left-24 opacity-80">{t('home.spotlights.watermarkColor')}</Watermark>
        </Reveal>
      </div>

      <div className="container-luxe mt-[150px] grid items-center gap-12 max-md:mt-20 lg:grid-cols-2 lg:gap-8">
        <Reveal className="order-2 lg:order-1">
          <img src="/images/team-image-2.jpg" alt={t('home.spotlights.foundationAlt')} className="w-full max-w-[665px]" />
        </Reveal>
        <div className="relative order-1 lg:order-2">
          <Watermark className="top-8 -right-40">{t('home.spotlights.watermarkSplash')}</Watermark>
          <Heading>
            {t('home.spotlights.foundationTitle1')}
            <br />
            {t('home.spotlights.foundationTitle2')}
          </Heading>
          <Reveal as="p" delay={0.16} className="relative mt-6 text-taupe">
            {t('home.spotlights.foundationText')}
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/shop" className="btn-cos relative mt-10">
              {t('common.exploreMore')}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
