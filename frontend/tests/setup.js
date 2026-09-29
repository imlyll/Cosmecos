import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from '../src/store/auth';
// Initialise translations as main.jsx does (English in jsdom).
import '../src/i18n';

afterEach(() => {
  cleanup();
  useAuthStore.setState({ token: null, user: null, sessionChecked: false });
  localStorage.clear();
});
