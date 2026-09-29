import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BASE = 'Cosmecos';

/** Sets the tab title ("Title – Cosmecos"); without a title, the translated shop tagline is used. */
export function useDocumentTitle(title) {
  const { t } = useTranslation();
  const tagline = t('meta.tagline');
  useEffect(() => {
    document.title = title ? `${title} – ${BASE}` : `${BASE} – ${tagline}`;
  }, [title, tagline]);
}
