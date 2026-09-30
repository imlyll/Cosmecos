import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Framed from '../ui/Framed';
import Reveal from '../ui/Reveal';
import Counter from '../ui/Counter';

const STATS = [
  { value: 550, suffix: ' k', key: 'sold' },
  { value: 10, suffix: ' +', key: 'years' },
];

/** "About Cosmecos" block: framed photo with a label on the left, story and counters on the right. */
export default function AboutSection() {
  const { t } = useTranslation();
  return (
    <section className="relative py-[150px] max-md:py-20">
      <img
        src="/images/about-bg-1-2.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-[230px] left-0 hidden w-[160px] lg:block"
      />
      <div className="container-luxe grid items-center gap-16 lg:grid-cols-[570px_1fr] lg:gap-[126px]">
        <Reveal className="relative">
          <Framed>
            <div className="relative h-[420px] overflow-hidden sm:h-[620px]">
              <img src="/images/home1-image-1.jpg" alt="" className="size-full object-cover" />
              <span className="absolute top-[60%] left-1/2 w-[308px] max-w-[80%] -translate-x-1/2 bg-white py-[22px] text-center font-sans text-xl tracking-[0.2em] text-ink uppercase">
                {t('home.about.label')}
              </span>
            </div>
          </Framed>
        </Reveal>

        <div>
          <Reveal as="p" className="eyebrow">
            {t('home.about.eyebrow')}
          </Reveal>
          <Reveal as="h2" delay={0.08} className="text-[28px] leading-[1.47] font-light uppercase md:text-[38px] md:leading-[56px]">
            {t('home.about.titleLine1')}
            <br />
            {t('home.about.titleLine2')}
          </Reveal>
          <Reveal as="p" delay={0.16} className="mt-7 border-l-2 border-rose pl-5 font-semibold text-ink">
            {t('home.about.lead')}
          </Reveal>
          <Reveal as="p" delay={0.2} className="mt-4 text-taupe">
            {t('home.about.text')}
          </Reveal>
          <Reveal delay={0.25} className="mt-8 flex gap-16">
            {STATS.map((s) => (
              <div key={s.key}>
                <p className="font-serif text-[50px] leading-none font-light text-rose">
                  <Counter to={s.value} />
                  {s.suffix}
                </p>
                <p className="mt-4 pl-5 font-serif text-lg font-medium text-ink">{t(`home.about.${s.key}`)}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.3}>
            <Link to="/about-us" className="btn-cos mt-10">
              {t('common.exploreMore')}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
