/* Drives the storefront's real hooks against the real API (in-memory MongoDB, started in globalSetup). */
import { beforeAll, describe, expect, inject, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api, http } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth';
import { useUIStore } from '../src/store/ui';
import { useChangePassword, useLogin, useLogout, useRegister } from '../src/hooks/useAuth';
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from '../src/hooks/useCart';
import { useToggleWishlist, useWishlist } from '../src/hooks/useWishlist';
import { useCancelOrder, useOrders, usePlaceOrder } from '../src/hooks/useOrders';
import { useSessionBootstrap } from '../src/hooks/useSession';
import { useRequireAuth } from '../src/hooks/useRequireAuth';

const backend = inject('backend');
const address = {
  fullName: 'Leyla M',
  phone: '+994501234567',
  line1: '1 Nizami St',
  city: 'Baku',
  postalCode: 'AZ1000',
  country: 'Azerbaijan',
};

beforeAll(() => {
  http.defaults.baseURL = `${backend.url}/api`;
});

function setup(hook) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return { qc, ...renderHook(hook, { wrapper }) };
}

let n = 0;
async function registerFresh() {
  const email = `shopper${Date.now()}${n++}@test.com`;
  const { result } = setup(() => useRegister());
  await act(() => result.current.mutateAsync({ name: 'Shopper Test', email, password: 'Secret123' }));
  return email;
}

describe('Auth flow', () => {
  it('register stores the JWT in localStorage and /auth/me accepts it', async () => {
    const email = await registerFresh();
    const { token, user } = useAuthStore.getState();
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(user).toMatchObject({ email, role: 'user' });
    expect(JSON.parse(localStorage.getItem('cosmecos-auth')).state.token).toBe(token);
    expect(document.cookie).toBe('');
    expect((await api('/auth/me')).user.email).toBe(email);
  });

  it('login with wrong password rejects without creating a session', async () => {
    const email = await registerFresh();
    useAuthStore.getState().logout();
    const { result } = setup(() => useLogin());
    await expect(act(() => result.current.mutateAsync({ email, password: 'Wrong1234' }))).rejects.toMatchObject({
      status: 401,
    });
    expect(useAuthStore.getState().token).toBeNull();
    await act(() => result.current.mutateAsync({ email, password: 'Secret123' }));
    expect(useAuthStore.getState().token).toBeTruthy();
  });

  it('session bootstrap verifies a stored token on page load', async () => {
    const email = await registerFresh();
    useAuthStore.setState({ user: { email: 'stale@cache' }, sessionChecked: false });
    setup(() => useSessionBootstrap());
    await waitFor(() => expect(useAuthStore.getState().sessionChecked).toBe(true));
    expect(useAuthStore.getState().user.email).toBe(email);
  });

  it('session bootstrap clears a tampered / expired token', async () => {
    await registerFresh();
    const bad = useAuthStore.getState().token.slice(0, -4) + 'AAAA';
    useAuthStore.setState({ token: bad, sessionChecked: false });
    setup(() => useSessionBootstrap());
    await waitFor(() => expect(useAuthStore.getState().sessionChecked).toBe(true));
    expect(useAuthStore.getState().token).toBeNull();
    expect(JSON.parse(localStorage.getItem('cosmecos-auth')).state.token).toBeNull();
  });

  it('a wrong current password keeps the user signed in; a correct one rotates the token', async () => {
    await registerFresh();
    const before = useAuthStore.getState().token;
    const { result } = setup(() => useChangePassword());
    await expect(
      act(() => result.current.mutateAsync({ currentPassword: 'Nope12345', newPassword: 'Newpass123' }))
    ).rejects.toMatchObject({ status: 400 });
    expect(useAuthStore.getState().token).toBe(before);

    await new Promise((r) => setTimeout(r, 1100)); // JWT iat has 1s resolution
    await act(() => result.current.mutateAsync({ currentPassword: 'Secret123', newPassword: 'Newpass123' }));
    const after = useAuthStore.getState().token;
    expect(after).not.toBe(before);
    expect((await api('/auth/me')).user).toBeTruthy();
  });

  it('logout clears the session and cached cart', async () => {
    await registerFresh();
    const token = useAuthStore.getState().token;
    const { result, qc } = setup(() => ({ cart: useCart(), logout: useLogout() }));
    await waitFor(() => expect(result.current.cart.isSuccess).toBe(true));
    act(() => result.current.logout());
    expect(useAuthStore.getState().token).toBeNull();
    expect(qc.getQueryData(['cart', token])).toBeUndefined();
    await waitFor(() => expect(result.current.cart.cart.items).toHaveLength(0));
    await expect(api('/cart')).rejects.toMatchObject({ status: 401 });
  });

  it('guest actions wait for sign-in, then run automatically', async () => {
    let ran = 0;
    const { result } = setup(() => useRequireAuth());
    act(() => result.current(() => ran++));
    expect(ran).toBe(0);
    expect(useUIStore.getState().authModal).toMatchObject({ open: true, view: 'login' });
    await registerFresh();
    act(() => useUIStore.getState().runPendingAction());
    expect(ran).toBe(1);
  });
});

describe('Cart, wishlist and checkout', () => {
  it('cart: add, merge, variant check, update, remove', async () => {
    await registerFresh();
    const { result } = setup(() => ({
      cart: useCart(),
      add: useAddToCart({ openDrawer: false }),
      update: useUpdateCartItem(),
      remove: useRemoveCartItem(),
    }));
    await waitFor(() => expect(result.current.cart.isSuccess).toBe(true));
    expect(result.current.cart.cart.items).toHaveLength(0);

    await expect(
      act(() => result.current.add.mutateAsync({ productId: backend.lipstickId, quantity: 1 }))
    ).rejects.toMatchObject({ status: 400 });

    await act(() => result.current.add.mutateAsync({ productId: backend.serumId, quantity: 1 }));
    await act(() => result.current.add.mutateAsync({ productId: backend.serumId, quantity: 2 }));
    await act(() =>
      result.current.add.mutateAsync({ productId: backend.lipstickId, variantId: backend.roseId, quantity: 1 })
    );
    // Query observers re-render on the next tick after the cache is written.
    await waitFor(() => expect(result.current.cart.cart.items).toHaveLength(2));
    let cart = result.current.cart.cart;
    expect(cart.itemCount).toBe(4);
    expect(cart.itemsPrice).toBe(140);

    const serumLine = cart.items.find((i) => i.product._id === backend.serumId);
    await act(() => result.current.update.mutateAsync({ itemId: serumLine._id, quantity: 1 }));
    await act(() => result.current.remove.mutateAsync({ itemId: serumLine._id }));
    await waitFor(() => expect(result.current.cart.cart.items).toHaveLength(1));
    cart = result.current.cart.cart;
    expect(cart.itemsPrice).toBe(20);
    expect(cart.shippingPrice).toBeGreaterThan(0);
  });

  it('wishlist: optimistic toggle on and off', async () => {
    await registerFresh();
    const product = { _id: backend.serumId, name: 'Vitamin C Serum' };
    const { result } = setup(() => ({ list: useWishlist(), toggle: useToggleWishlist() }));
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(() => result.current.toggle.mutateAsync({ product }));
    await waitFor(() => expect(result.current.list.has(backend.serumId)).toBe(true));
    expect(result.current.list.count).toBe(1);
    expect((await api('/wishlist')).count).toBe(1);

    await act(() => result.current.toggle.mutateAsync({ product }));
    await waitFor(() => expect(result.current.list.has(backend.serumId)).toBe(false));
    expect((await api('/wishlist')).count).toBe(0);
  });

  it('checkout: places an order from the cart with a coupon, then cancels it', async () => {
    await registerFresh();
    const { result } = setup(() => ({
      cart: useCart(),
      add: useAddToCart({ openDrawer: false }),
      place: usePlaceOrder(),
      orders: useOrders(),
      cancel: useCancelOrder(),
    }));
    await act(() => result.current.add.mutateAsync({ productId: backend.serumId, quantity: 3 }));

    const { order } = await act(() =>
      result.current.place.mutateAsync({ shippingAddress: address, paymentMethod: 'cash_on_delivery', couponCode: 'TEN' })
    );
    expect(order).toMatchObject({ status: 'Pending', itemsPrice: 120, discount: 12, shippingPrice: 0, totalPrice: 108 });

    await waitFor(() => expect(result.current.cart.cart.items).toHaveLength(0));
    await waitFor(() => expect(result.current.orders.data?.orders).toHaveLength(1));
    expect((await api(`/orders/${order._id}`)).order.orderNumber).toBe(order.orderNumber);
    expect(useAuthStore.getState().token).toBeTruthy();

    await act(() => result.current.cancel.mutateAsync(order._id));
    expect((await api(`/orders/${order._id}`)).order.status).toBe('Cancelled');
  });

  it('checkout rejects an empty cart and invalid address', async () => {
    await registerFresh();
    const { result } = setup(() => usePlaceOrder());
    await expect(act(() => result.current.mutateAsync({ shippingAddress: address }))).rejects.toMatchObject({
      status: 400,
      message: 'Your cart is empty',
    });
    await expect(act(() => result.current.mutateAsync({ shippingAddress: { city: 'x' } }))).rejects.toMatchObject({
      status: 400,
      errors: expect.arrayContaining([expect.objectContaining({ field: 'shippingAddress.fullName' })]),
    });
  });

  it('customers cannot reach admin endpoints but stay signed in', async () => {
    await registerFresh();
    await expect(api('/admin/stats')).rejects.toMatchObject({ status: 403 });
    expect(useAuthStore.getState().token).toBeTruthy();
  });

  it('admin login through the shared client reaches admin endpoints', async () => {
    const data = await api('/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'Admin1234' } });
    useAuthStore.getState().setAuth(data);
    expect((await api('/admin/stats')).stats).toBeTruthy();
  });
});
