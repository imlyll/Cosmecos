/* Theme switching and language switching, separately and together (real API for catalog text). */
import { afterEach, beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import i18n from '../src/i18n';
import { http } from '../src/lib/api';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import ThemeToggle from '../src/components/layout/ThemeToggle';
import { LanguageToggle } from '../src/components/layout/LanguageSwitcher';
import { useCategories, useProducts } from '../src/hooks/useCatalog';
import Footer from '../src/components/layout/Footer';

const backend = inject('backend');

// jsdom has no IntersectionObserver; the footer's scroll-reveal animations only need it to exist.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

beforeAll(() => {
  http.defaults.baseURL = `${backend.url}/api`;
});

afterEach(async () => {
  document.documentElement.classList.remove('dark');
  vi.unstubAllGlobals();
  await act(() => i18n.changeLanguage('en'));
});

/** matchMedia stub reporting the given OS colour scheme. */
function stubSystemTheme(dark) {
  const listeners = new Set();
  const mq = {
    matches: dark,
    addEventListener: (_e, fn) => listeners.add(fn),
    removeEventListener: (_e, fn) => listeners.delete(fn),
  };
  vi.stubGlobal('matchMedia', () => mq);
  return (nowDark) => {
    mq.matches = nowDark;
    listeners.forEach((fn) => fn({ matches: nowDark }));
  };
}

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ThemeProvider>{children}</ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Theme', () => {
  it('follows the OS preference until the shopper chooses, then remembers the choice', () => {
    const setSystem = stubSystemTheme(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => setSystem(false));
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('cosmecos-theme')).toBe('dark');
    act(() => setSystem(false)); // an explicit choice wins over the OS
    expect(result.current.theme).toBe('dark');
  });

  it('starts from the saved choice', () => {
    stubSystemTheme(true);
    localStorage.setItem('cosmecos-theme', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('the sun/moon toggle switches the <html> class and its label', () => {
    stubSystemTheme(false);
    render(<ThemeToggle />, { wrapper });
    const button = screen.getByRole('button', { name: 'Switch to dark mode' });
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
  });
});

describe('Language', () => {
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

describe('Theme and language together', () => {
  it('switching one never resets the other', async () => {
    stubSystemTheme(false);
    render(
      <>
        <ThemeToggle />
        <LanguageToggle />
      </>,
      { wrapper }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'AZE' }));
    // The toggle's label is translated and the theme is unchanged.
    expect(await screen.findByRole('button', { name: 'İşıqlı rejimə keç' })).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'İşıqlı rejimə keç' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(i18n.resolvedLanguage).toBe('az');
    expect(localStorage.getItem('cosmecos-theme')).toBe('light');
    expect(localStorage.getItem('cosmecos-lang')).toBe('az');
  });
});
