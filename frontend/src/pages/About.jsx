import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Framed from '../components/ui/Framed';
import Reveal from '../components/ui/Reveal';
import Counter from '../components/ui/Counter';
import { Modal } from '../components/ui/Drawer';
import { SocialIcon, SOCIALS } from '../components/ui/Brand';
import Partners, { PARTNERS_BLACK } from '../components/home/Partners';
import BeautyGuide from '../components/home/BeautyGuide';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EASE } from '../lib/motion';

const TYPES = [
  { icon: '/images/icons/type-fresh.png', key: 'fresh' },
  { icon: '/images/icons/type-floral.png', key: 'floral' },
  { icon: '/images/icons/type-oceanic.png', key: 'oceanic' },
];

const ACHIEVEMENTS = [
  { value: 200, suffix: ' K', key: 'sold' },
  { value: 600, suffix: ' K', key: 'clients' },
  { value: 122, suffix: '', key: 'countries' },
  { value: 10, suffix: ' K', key: 'employees' },
];

const TEAM = [
  { name: 'Mika Boosters', role: 'productManager', image: '/images/team-1.jpg' },
  { name: 'Huanita Concha', role: 'serviceManager', image: '/images/team-2.jpg' },
  { name: 'Pier Goodman', role: 'chiefManager', image: '/images/team-3.jpg' },
  { name: 'Ellen Johnson', role: 'officeHead', image: '/images/team-4.jpg' },
];

const VIDEO_URL = 'https://www.youtube.com/embed/NbVAgoJUb04?autoplay=1&rel=0';

function Intro() {
  const { t } = useTranslation();
  return (
    <section className="container-luxe grid items-center gap-16 overflow-x-clip py-[150px] max-md:py-20 lg:grid-cols-[470px_1fr] lg:gap-[115px]">
      <Reveal className="relative">
        <Framed>
          <img src="/images/about-image-1.jpg" alt={t('about.introAlt')} className="h-[420px] w-full object-cover sm:h-[480px]" />
        </Framed>
        <span
          aria-hidden
          className="pointer-events-none absolute -top-6 left-[45%] z-20 font-script text-[130px] leading-none text-[#f5b996] select-none sm:text-[160px]"
        >
          {t('about.newScript')}
        </span>
      </Reveal>
      <div>
        <Reveal
          as="h2"
          className="text-[28px] leading-[1.47] font-light uppercase md:text-[38px] md:leading-[56px]"
        >
          {t('about.introTitle')}
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-6 text-taupe">
          {t('about.introText')}
        </Reveal>
        <div className="mt-[60px] grid grid-cols-3 gap-4 text-center">
          {TYPES.map((type, i) => (
            <Reveal key={type.key} delay={0.15 + i * 0.08}>
              <img src={type.icon} alt="" className="mx-auto size-[110px] object-contain sm:size-[133px]" />
              <h3 className="-mt-5 text-lg font-normal sm:text-xl">{t(`about.types.${type.key}`)}</h3>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Achievements() {
  const { t } = useTranslation();
  return (
    <section className="container-luxe pb-[150px] max-md:pb-20">
      <SectionHeading title={t('about.achievementsTitle')} subtitle={t('about.achievementsText')} />
      <div className="grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a, i) => (
          <Reveal key={a.key} delay={i * 0.1} className="relative mx-auto grid size-[230px] place-items-center sm:size-[260px]">
            <img
              src={`/images/icons/counter-${i}.png`}
              alt=""
              className="absolute inset-0 size-full object-contain"
            />
            <div className="relative text-center">
              <p className="font-script text-[64px] leading-none text-ink">
                <Counter to={a.value} suffix={a.suffix} />
              </p>
              <p className="mt-3 font-sans font-bold text-body uppercase">{t(`about.stats.${a.key}`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function VideoBlock() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <section className="container-luxe pb-[150px] max-md:pb-20">
      <Reveal>
        <Framed>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('a11y.playVideo')}
            className="group relative block w-full overflow-hidden"
          >
            <img
              src="/images/about-video-2.jpg"
              alt={t('about.videoAlt')}
              className="aspect-[1130/636] w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
            <span className="absolute top-1/2 left-1/2 grid size-[140px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/70 transition-transform duration-500 group-hover:scale-110">
              <Play className="ml-1.5 size-8 fill-ink text-ink" />
            </span>
          </button>
        </Framed>
      </Reveal>
      <Modal open={open} onClose={() => setOpen(false)} className="max-w-5xl bg-black" label={t('a11y.video')}>
        <div className="aspect-video">
          {open && (
            <iframe
              title={t('a11y.videoTitle')}
              src={VIDEO_URL}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          )}
        </div>
      </Modal>
    </section>
  );
}

function Team() {
  const { t } = useTranslation();
  return (
    <section className="relative pb-[60px]">
      <img
        src="/images/bg-pricing-section-3-2.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-[240px] right-0 hidden w-[180px] xl:block"
      />
      <div className="container-luxe">
        <div className="mb-[70px] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Reveal className="max-w-[560px]">
            <h2 className="text-[28px] leading-[1.47] font-light uppercase md:text-[38px]">{t('about.teamTitle')}</h2>
            <p className="mt-3 text-taupe">{t('about.teamText')}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/contacts" className="btn-cos">
              {t('common.viewMore')}
            </Link>
          </Reveal>
        </div>
        <div className="grid gap-x-[30px] gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.08} className="text-center">
              <Framed>
                <div className="overflow-hidden bg-[#f8f5f3]">
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    className="aspect-[243/296] w-full object-cover transition-transform duration-[1.2s] hover:scale-105"
                  />
                </div>
              </Framed>
              <h3 className="mt-6 text-2xl font-normal">{m.name}</h3>
              <p className="mt-1 font-serif text-lg font-medium text-mute">{t(`about.roles.${m.role}`)}</p>
              <div className="mt-4 flex justify-center gap-[15px]">
                {SOCIALS.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('a11y.onSocial', { name: m.name, network: s.name })}
                    className="grid size-[30px] place-items-center rounded-full border border-ink text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
                  >
                    <SocialIcon name={s.key} className="size-3" />
                  </a>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const { t } = useTranslation();
  useDocumentTitle(t('about.title'));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: EASE }}>
      <PageHero title={t('about.title')} />
      <Intro />
      <Achievements />
      <VideoBlock />
      <Team />
      <Partners logos={PARTNERS_BLACK} band={false} className="pt-[60px] pb-[130px]" />
      <BeautyGuide boxed={false} script="watermarkAbout" />
    </motion.div>
  );
}
