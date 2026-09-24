import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useProducts(params, options = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: ({ signal }) => api('/products', { params, signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProduct(idOrSlug) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: ({ signal }) => api(`/products/${encodeURIComponent(idOrSlug)}`, { signal }),
    enabled: Boolean(idOrSlug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
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
