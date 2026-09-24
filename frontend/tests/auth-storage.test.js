import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../src/store/auth';

const KEY = 'cosmecos-auth';
const stored = () => JSON.parse(localStorage.getItem(KEY) || 'null');

describe('JWT storage (localStorage, no cookies)', () => {
  it('persists token and user to localStorage on sign-in', () => {
    useAuthStore.getState().setAuth({ token: 'jwt.abc', user: { name: 'Leyla', role: 'user' } });
    expect(stored().state).toEqual({ token: 'jwt.abc', user: { name: 'Leyla', role: 'user' } });
  });

  it('does not persist sessionChecked, so every page load re-verifies the token', () => {
    useAuthStore.getState().setAuth({ token: 'jwt.abc', user: { name: 'L' } });
    expect(useAuthStore.getState().sessionChecked).toBe(true);
    expect(stored().state).not.toHaveProperty('sessionChecked');
  });

  it('never writes the token to a cookie', () => {
    useAuthStore.getState().setAuth({ token: 'jwt.abc', user: { name: 'L' } });
    expect(document.cookie).toBe('');
  });

  it('clears the stored token on logout', () => {
    useAuthStore.getState().setAuth({ token: 'jwt.abc', user: { name: 'L' } });
    useAuthStore.getState().logout();
    expect(stored().state).toEqual({ token: null, user: null });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('restores the session from localStorage (page reload)', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { token: 'jwt.saved', user: { name: 'Saved' } }, version: 0 }));
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().token).toBe('jwt.saved');
    expect(useAuthStore.getState().user.name).toBe('Saved');
  });
});
