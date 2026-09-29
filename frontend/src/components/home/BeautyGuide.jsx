import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Reveal from '../ui/Reveal';

/**
 * Dark "Find Your Beauty Guide" call to action (dark in both themes, so it keeps the light palette).
 * `boxed` (home) sits inside 30px side margins with the pink brush photo;
 * the full-width version closes the About page. `script` is a key under home.guide.
 */
export default function BeautyGuide({ boxed = true, script = 'watermarkHome' }) {
  const { t } = useTranslation();
  return (
    <section className={clsx('theme-light', boxed && 'px-4 sm:px-[30px]')}>
      <div
        className={clsx(
          'relative overflow-hidden bg-[#2a2a2a] bg-no-repeat',
          boxed ? 'bg-[length:auto_100%] bg-left' : ''
        )}
        style={boxed ? { backgroundImage: 'url(/images/home1-bg-7.jpg)' } : undefined}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-[40%] -translate-y-[40%] font-script text-[150px] leading-none text-white/[0.09] select-none md:text-[230px]"
        >
          {t(`home.guide.${script}`)}
        </span>
        <div className="container-luxe relative flex flex-col gap-8 py-[85px] md:flex-row md:items-center md:justify-between max-md:py-14">
          <Reveal>
            <h2 className="text-[34px] leading-[1.2] font-extralight text-white md:text-[60px]">
              {t('home.guide.title')}
            </h2>
            <p className="mt-3 text-lg text-white md:text-xl">{t('home.guide.text')}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/shop" className="btn-cos btn-cos-light">
              {t('common.viewMore')}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
