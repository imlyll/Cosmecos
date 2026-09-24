import { useLocation } from 'react-router';

/** Dark promo strip shown above the header on the home page only. */
export default function AnnouncementBar() {
  const { pathname } = useLocation();
  if (pathname !== '/') return null;

  return (
    <div className="bg-ink-soft px-4 text-white sm:px-6 lg:px-10">
      <p className="truncate py-[5px] font-serif text-[13px] leading-[30px] font-medium uppercase sm:text-[15px]">
        <span className="text-rose">25% off</span> on all products enter code:{' '}
        <span className="text-rose">Cosmecos sale</span>
      </p>
    </div>
  );
}
