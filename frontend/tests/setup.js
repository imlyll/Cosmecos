import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from '../src/store/auth';

afterEach(() => {
  cleanup();
  useAuthStore.setState({ token: null, user: null, sessionChecked: false });
  localStorage.clear();
});
