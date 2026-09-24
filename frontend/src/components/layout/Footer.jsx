import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Logo, SocialLinks } from '../ui/Brand';
import Reveal from '../ui/Reveal';
import { ContactList, CONTACT_ROWS } from './SidePanel';
import { NAV_LINKS, STORE_INFO, telHref } from './nav';

const USEFUL_LINKS = [
  { label: 'Eyeshadow Collection', to: '/shop?category=cosmetics' },
  { label: 'How Clean Make Up Brushes', to: '/shop?category=makeup-equipment' },
  { label: 'The Right Foundation', to: '/shop?category=body-care' },
];

const socialClass = 'border-white/30 text-white hover:border-rose hover:bg-rose';

function Newsletter() {
  const [email, setEmail] = useState('');
  const onSubmit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Please enter a valid email address');
    // No newsletter provider is connected yet; confirm locally.
    toast.success('Thank you for subscribing!');
    setEmail('');
  };
  return (
    <form onSubmit={onSubmit} className="mt-2 flex border-b border-white/20 focus-within:border-white">
      <label htmlFor="newsletter" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-[#8b8b8b]"
      />
      <button type="submit" aria-label="Subscribe" className="group px-2 text-white">
        <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
      </button>
    </form>
  );
}

function FooterMenu() {
  return (
    <nav aria-label="Footer">
      <ul className="flex flex-wrap justify-center gap-x-[70px] gap-y-3">
        {NAV_LINKS.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="font-serif text-[15px] font-semibold text-white uppercase transition-colors duration-300 hover:text-rose"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Big faint brush "C" watermark. */
function Watermark({ className }) {
  return (
    <img
      src="/images/footer-bg-2.png"
      alt=""
      aria-hidden
      className={`pointer-events-none absolute opacity-[0.07] invert select-none ${className}`}
    />
  );
}

/** Home page footer: Instagram tag, then a framed three-column block with the menu underneath. */
function HomeFooter() {
  return (
    <footer className="relative mt-[90px] bg-ink-soft text-[#b1b0b0]">
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noreferrer"
        className="group absolute top-0 left-1/2 z-10 block w-[270px] -translate-x-1/2 -translate-y-[63px] bg-white p-[10px]"
      >
        <span className="block border border-ink py-[25px] text-center transition-colors duration-300 group-hover:bg-ink">
          <span className="block font-serif text-[22px] leading-6 font-medium tracking-[0.12em] text-ink uppercase transition-colors group-hover:text-white">
            @Cosmecos
          </span>
          <span className="mt-1 block font-sans text-sm text-mute uppercase">Instagram</span>
        </span>
      </a>

      <div className="px-4 py-[33px] sm:px-[34px]">
        <div className="relative overflow-hidden border border-white/[0.07] pt-[100px] pb-[45px]">
          <Watermark className="top-0 left-1/2 w-[340px] -translate-x-1/2" />
          <div className="container-luxe relative grid gap-12 text-center md:grid-cols-3 md:text-left">
            <Reveal>
              <h3 className="mb-4 text-xl font-normal text-white">Contacts</h3>
              <ContactList className="inline-block text-left" />
            </Reveal>
            <Reveal delay={0.1} className="text-center">
              <Logo light className="mx-auto" />
              <p className="mx-auto mt-5 max-w-[540px] leading-[30px] md:-mx-[60px] md:max-w-none">
                Popularized through customer relationships with some of the world’s most recognizable faces, the
                “brow revolution”.
              </p>
              <SocialLinks className="mt-6 justify-center" itemClassName={socialClass} />
            </Reveal>
            <Reveal delay={0.2} className="md:text-right">
              <h3 className="mb-4 text-xl font-normal text-white">Useful Links</h3>
              <ul className="space-y-3">
                {USEFUL_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="font-serif font-medium text-white transition-colors hover:text-rose">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="relative mt-[70px]">
            <FooterMenu />
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Inner pages footer: brand, contacts and newsletter columns, then the menu on a separate row. */
function PageFooter() {
  const rows = [...CONTACT_ROWS, { text: STORE_INFO.phone2, href: telHref(STORE_INFO.phone2) }];
  return (
    <footer className="relative overflow-hidden bg-ink-soft text-[#b1b0b0]">
      <Watermark className="-top-4 right-[8%] hidden w-[340px] lg:block" />
      <div className="container-luxe relative grid gap-12 pt-[100px] pb-[90px] sm:grid-cols-2 lg:grid-cols-4">
        <Reveal>
          <Logo light />
          <p className="mt-[22px] max-w-[290px] leading-[30px]">
            Hardhead catfish pikehead, pearleye yellowtail snapper tuna fire bar.
          </p>
          <SocialLinks className="mt-[35px]" itemClassName={socialClass} />
        </Reveal>
        <Reveal delay={0.1}>
          <h3 className="mb-3 text-xl font-normal text-white">Contact us</h3>
          <ul className="space-y-[3px] font-serif font-medium text-white">
            {rows.map((r) => (
              <li key={r.text}>
                {r.href ? (
                  <a href={r.href} className="transition-colors hover:text-rose">
                    {r.text}
                  </a>
                ) : (
                  r.text
                )}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.2}>
          <h3 className="mb-3 text-xl font-normal text-white">Our newsletter</h3>
          <Newsletter />
        </Reveal>
      </div>
      <div className="relative border-t border-white/[0.07] py-[34px]">
        <FooterMenu />
      </div>
    </footer>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  return pathname === '/' ? <HomeFooter /> : <PageFooter />;
}
