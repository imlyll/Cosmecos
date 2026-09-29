import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import { formatDate } from '../../lib/format';

const POSTS = [
  { key: 'p1', date: '2020-11-24', image: '/images/6887-2.jpg' },
  { key: 'p2', date: '2020-11-30', image: '/images/2272562-2.jpg' },
  { key: 'p3', date: '2020-11-30', image: '/images/2373413-2.jpg' },
];

/** "Our beauty blog" teaser cards. */
export default function Blog() {
  const { t } = useTranslation();
  return (
    <section className="container-luxe pt-[150px] max-md:pt-20">
      <SectionHeading eyebrow={t('home.blog.eyebrow')} title={t('home.blog.title')} />
      <div className="grid gap-[30px] md:grid-cols-3">
        {POSTS.map((post, i) => (
          <Reveal key={post.key} delay={i * 0.1}>
            <article className="group relative h-full border border-line p-5">
              <div className="overflow-hidden">
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[33/28] w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-105"
                />
              </div>
              <span className="theme-light absolute top-[35px] left-0 bg-ink-soft px-[11px] font-sans text-sm leading-[30px] text-white uppercase">
                {t('home.blog.badge')}
              </span>
              <p className="mt-[30px] font-sans text-sm text-mute uppercase">
                {formatDate(`${post.date}T12:00:00`, { month: 'long' })}
                <span className="mx-2.5 text-rose">—</span>
                {t('home.blog.by')}
              </p>
              <h3 className="mt-3 text-2xl leading-[1.3] font-normal">{t(`home.blog.${post.key}`)}</h3>
              <Link
                to="/about-us"
                className="mt-6 mb-5 inline-block border-b border-rose pb-1 font-sans text-sm font-semibold text-rose uppercase transition-colors hover:border-ink hover:text-ink"
              >
                {t('common.readMore')}
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-[50px] text-center">
        <Link to="/about-us" className="btn-cos">
          {t('common.viewMore')}
        </Link>
      </div>
    </section>
  );
}
