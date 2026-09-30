/* Language switching on the storefront and in the admin panel (real API for data). */
import { afterEach, beforeAll, describe, expect, inject, it } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import i18n from '../src/i18n';
import { api, http } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth';
import { LanguageToggle } from '../src/components/layout/LanguageSwitcher';
import { useCategories, useProducts } from '../src/hooks/useCatalog';
import Footer from '../src/components/layout/Footer';
import Dashboard from '../src/admin/pages/Dashboard';
import Products from '../src/admin/pages/Products';
import Orders from '../src/admin/pages/Orders';

const backend = inject('backend');

// jsdom lacks the observers used by scroll-reveal animations, counters and the sales chart.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??= NoopObserver;
globalThis.ResizeObserver ??= NoopObserver;

beforeAll(() => {
  http.defaults.baseURL = `${backend.url}/api`;
});

afterEach(async () => {
  window.history.replaceState({}, '', '/');
  await act(() => i18n.changeLanguage('en'));
});

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

async function signInAsAdmin() {
  const data = await api('/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'Admin1234' } });
  useAuthStore.getState().setAuth(data);
  // The API client marks requests from /admin pages as wanting original (untranslated) product data.
  window.history.replaceState({}, '', '/admin');
}

describe('Storefront language', () => {
  it('the AZE | ENG | RU toggle translates the page and persists the choice', async () => {
    render(
      <>
        <LanguageToggle />
        <Footer />
      </>,
      { wrapper }
    );
    expect(screen.getByText('Useful Links')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'RU' }));
    expect(await screen.findByText('Полезные ссылки')).toBeTruthy();
    expect(screen.getByText(/Все права защищены/)).toBeTruthy();
    expect(localStorage.getItem('cosmecos-lang')).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(screen.getByRole('button', { name: 'RU' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('catalog text comes from the API in the current language and refetches on change', async () => {
    const { result } = renderHook(
      () => ({ products: useProducts({ search: 'vitamin' }), categories: useCategories() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.products.data?.products[0]?.name).toBe('Vitamin C Serum'));

    await act(() => i18n.changeLanguage('az'));
    await waitFor(() => expect(result.current.products.data?.products[0]?.name).toBe('C vitaminli serum'));
    await waitFor(() => expect(result.current.categories.data?.[0]?.name).toBe('Dəri baxımı'));

    await act(() => i18n.changeLanguage('ru'));
    await waitFor(() => expect(result.current.products.data?.products[0]?.name).toBe('Сыворотка с витамином C'));
  });
});

describe('Admin panel language', () => {
  it('dashboard counters, cards and status badges follow the language', async () => {
    await signInAsAdmin();
    await act(() => i18n.changeLanguage('az'));
    render(<Dashboard />, { wrapper });

    expect(screen.getByRole('heading', { name: 'İdarə paneli' })).toBeTruthy();
    expect(screen.getByText('Ümumi gəlir')).toBeTruthy();
    expect(screen.getByText('Statusa görə sifarişlər')).toBeTruthy();
    expect(await screen.findByText('Gözləmədə')).toBeTruthy();

    await act(() => i18n.changeLanguage('ru'));
    expect(screen.getByRole('heading', { name: 'Панель управления' })).toBeTruthy();
    expect(screen.getByText('Общая выручка')).toBeTruthy();
    expect(screen.getByText('Ожидает')).toBeTruthy();
  });

  it('product table labels are translated while product data stays in its original fields', async () => {
    await signInAsAdmin();
    await act(() => i18n.changeLanguage('az'));
    render(<Products />, { wrapper });

    expect(screen.getByRole('link', { name: /Yeni məhsul əlavə et/ })).toBeTruthy();
    expect(screen.getByText('Əməliyyatlar')).toBeTruthy();
    // The admin edits the original product, so its name is not replaced by the Azerbaijani translation.
    expect(await screen.findByText('Vitamin C Serum')).toBeTruthy();
    expect(screen.queryByText('C vitaminli serum')).toBeNull();
    expect(screen.getAllByText('Aktiv').length).toBeGreaterThan(0);

    await act(() => i18n.changeLanguage('ru'));
    expect(screen.getByRole('link', { name: /Добавить товар/ })).toBeTruthy();
    expect(screen.getByText('Действия')).toBeTruthy();
  });

  it('order management tabs and table headers are translated', async () => {
    await signInAsAdmin();
    await act(() => i18n.changeLanguage('ru'));
    render(<Orders />, { wrapper });
    expect(screen.getByRole('heading', { name: 'Заказы' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Отправлен' })).toBeTruthy();
    expect(screen.getByText('Управление')).toBeTruthy();
    expect(await screen.findByPlaceholderText('Поиск по номеру заказа…')).toBeTruthy();
  });

  it('API error messages shown in the admin follow its language', async () => {
    await signInAsAdmin();
    await act(() => i18n.changeLanguage('az'));
    await expect(api('/admin/orders/000000000000000000000000/status', { method: 'PATCH', body: { status: 'Shipped' } })).rejects.toMatchObject({
      status: 404,
      message: 'Sifariş tapılmadı',
    });
  });
});
