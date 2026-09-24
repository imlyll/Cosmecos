import { Link } from 'react-router';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';

const POSTS = [
  { title: 'Color Correcy with Loose Setting Powder', date: 'November 24, 2020', image: '/images/6887-2.jpg' },
  { title: 'Choose Your Foundation Cream', date: 'November 30, 2020', image: '/images/2272562-2.jpg' },
  { title: '5 Tips How to Shape Your Incredible Eyebrows', date: 'November 30, 2020', image: '/images/2373413-2.jpg' },
];

/** "Our beauty blog" teaser cards. */
export default function Blog() {
  return (
    <section className="container-luxe pt-[150px] max-md:pt-20">
      <SectionHeading eyebrow="News & Articles" title="Our beauty blog" />
      <div className="grid gap-[30px] md:grid-cols-3">
        {POSTS.map((post, i) => (
          <Reveal key={post.title} delay={i * 0.1}>
            <article className="group relative h-full border border-line p-5">
              <div className="overflow-hidden">
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[33/28] w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-105"
                />
              </div>
              <span className="absolute top-[35px] left-0 bg-ink-soft px-[11px] font-sans text-sm leading-[30px] text-white uppercase">
                Beauty
              </span>
              <p className="mt-[30px] font-sans text-sm text-mute uppercase">
                {post.date}
                <span className="mx-2.5 text-rose">—</span>
                By admin
              </p>
              <h3 className="mt-3 text-2xl leading-[1.3] font-normal">{post.title}</h3>
              <Link
                to="/about-us"
                className="mt-6 mb-5 inline-block border-b border-rose pb-1 font-sans text-sm font-semibold text-rose uppercase transition-colors hover:border-ink hover:text-ink"
              >
                Read more
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-[50px] text-center">
        <Link to="/about-us" className="btn-cos">
          View more
        </Link>
      </div>
    </section>
  );
}
