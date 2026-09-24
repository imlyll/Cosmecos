import { useEffect } from 'react';

const BASE = 'Cosmecos';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – ${BASE}` : `${BASE} – Cosmetics & Beauty Shop`;
  }, [title]);
}
