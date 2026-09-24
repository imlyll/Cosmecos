import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, ApiError, http } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth';

let requests;
let reply;
const originalAdapter = http.defaults.adapter;

beforeEach(() => {
  requests = [];
  reply = () => ({ status: 200, data: { success: true } });
  // Fake transport: records each request and answers with `reply(config)`.
  http.defaults.adapter = async (config) => {
    requests.push(config);
    const { status, data, network } = reply(config);
    if (network) throw Object.assign(new Error('Network Error'), { config, isAxiosError: true });
    const response = { status, data, headers: {}, config, statusText: String(status) };
    if (status >= 400) {
      throw Object.assign(new Error(`Request failed with status code ${status}`), {
        config,
        response,
        isAxiosError: true,
      });
    }
    return response;
  };
});

afterEach(() => {
  http.defaults.adapter = originalAdapter;
});

const signIn = () => useAuthStore.getState().setAuth({ token: 'jwt.valid', user: { name: 'L', role: 'user' } });

describe('API client', () => {
  it('sends the stored JWT as a Bearer header', async () => {
    signIn();
    await api('/cart');
    expect(requests[0].headers.Authorization).toBe('Bearer jwt.valid');
  });

  it('sends no Authorization header for guests', async () => {
    await api('/products');
    expect(requests[0].headers.Authorization).toBeUndefined();
  });

  it('signs the user out when the API rejects their token', async () => {
    signIn();
    reply = () => ({ status: 401, data: { success: false, message: 'Token expired, please log in again' } });
    await expect(api('/auth/me')).rejects.toMatchObject({ status: 401, message: 'Token expired, please log in again' });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('keeps the session when a signed-in user mistypes credentials on a login form', async () => {
    signIn();
    reply = () => ({ status: 401, data: { success: false, message: 'Invalid email or password' } });
    await expect(api('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } })).rejects.toThrow(
      'Invalid email or password'
    );
    expect(useAuthStore.getState().token).toBe('jwt.valid');
  });

  it('does not touch the session on a guest 401', async () => {
    reply = () => ({ status: 401, data: { success: false, message: 'Authentication token missing' } });
    await expect(api('/cart')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('keeps the session on 403 and 400 responses', async () => {
    signIn();
    reply = () => ({ status: 403, data: { success: false, message: 'Forbidden' } });
    await expect(api('/admin/stats')).rejects.toMatchObject({ status: 403 });
    reply = () => ({
      status: 400,
      data: { success: false, message: 'Validation failed', errors: [{ field: 'quantity', message: 'Too many' }] },
    });
    await expect(api('/cart/items', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      errors: [{ field: 'quantity', message: 'Too many' }],
    });
    expect(useAuthStore.getState().token).toBe('jwt.valid');
  });

  it('turns network failures into a readable ApiError with status 0', async () => {
    reply = () => ({ network: true });
    await expect(api('/products')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/reach the server/) });
  });

  it('serialises array params comma-separated and drops empty ones', async () => {
    await api('/products', { params: { tags: ['a', 'b'], search: '', brand: undefined, page: 2 } });
    expect(http.getUri(requests[0])).toBe('/api/products?tags=a%2Cb&page=2');
  });
});
