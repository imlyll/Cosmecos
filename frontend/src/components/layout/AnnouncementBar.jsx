import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

/** Dark promo strip shown above the header on the home page only. */
export default function AnnouncementBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  if (pathname !== '/') return null;

  return (
    <div className="bg-ink-soft px-4 text-white sm:px-6 lg:px-10">
      <p className="truncate py-[5px] font-serif text-[13px] leading-[30px] font-medium uppercase sm:text-[15px]">
        <span className="text-rose">{t('announcement.discount')}</span> {t('announcement.text')}{' '}
        <span className="text-rose">{t('announcement.code')}</span>
      </p>
    </div>
  );
}
