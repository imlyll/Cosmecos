import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

// Product and category text comes back in the current language (see lib/api.js), so it is part of every key.
const useLang = () => useTranslation().i18n.resolvedLanguage;

export function useProducts(params, options = {}) {
  const lang = useLang();
  return useQuery({
    queryKey: ['products', params, lang],
    queryFn: ({ signal }) => api('/products', { params, signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProduct(idOrSlug) {
  const lang = useLang();
  return useQuery({
    queryKey: ['product', idOrSlug, lang],
    queryFn: ({ signal }) => api(`/products/${encodeURIComponent(idOrSlug)}`, { signal }),
    enabled: Boolean(idOrSlug),
    // Keep showing the product while its other-language version loads, but never a different product.
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === idOrSlug ? prev : undefined),
  });
}

export function useCategories() {
  const lang = useLang();
  return useQuery({
    queryKey: ['categories', lang],
    queryFn: () => api('/categories'),
    select: (d) => d.categories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['product-filters'],
    queryFn: () => api('/products/filters'),
    staleTime: 10 * 60 * 1000,
  });
}
