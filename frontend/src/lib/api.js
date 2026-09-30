import axios from 'axios';
import { useAuthStore } from '../store/auth';
import i18n from '../i18n';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  /** `code` is the API's machine-readable error code (e.g. OTP_INVALID); `data` is the full error body. */
  constructor(message, status, errors, { code, data } = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.data = data;
  }
}

/** Shared axios instance. Interceptors attach the JWT and normalise errors. */
export const http = axios.create({
  baseURL: `${BASE}/api`,
  headers: { Accept: 'application/json' },
  timeout: 30_000,
  // Arrays are sent comma-separated (?tags=a,b), which the API expects.
  paramsSerializer: (params) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    return qs.toString();
  },
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // The API answers error messages and product/category text in this language. The admin panel edits
  // the original fields, so it asks for those; its messages still follow the chosen language.
  config.headers['X-Language'] = i18n.resolvedLanguage || i18n.language;
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    config.headers['X-Content-Original'] = '1';
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const res = error.response;
    if (!res) {
      return Promise.reject(new ApiError('Unable to reach the server. Please check your connection.', 0));
    }
    // A rejected token means the session is over; clear it so the UI shows a guest.
    // Credential endpoints answer 401 for a wrong password, which says nothing about the current session.
    const sentToken = Boolean(error.config?.headers?.Authorization);
    const isCredentialCheck = /^\/?auth\/(login|register|verify-otp|resend-otp)$/.test(error.config?.url || '');
    if (res.status === 401 && sentToken && !isCredentialCheck) useAuthStore.getState().logout();
    const data = res.data || {};
    return Promise.reject(
      new ApiError(data.message || 'Something went wrong', res.status, data.errors, { code: data.code, data })
    );
  }
);

/** Convenience wrapper returning the response body: api('/products', { params }). */
export async function api(path, { method = 'GET', body, params, signal, onUploadProgress } = {}) {
  const res = await http.request({ url: path, method, data: body, params, signal, onUploadProgress });
  return res.data;
}

/** Resolves image URLs served by the API (e.g. /uploads/...) against the API origin. */
// Missing images give undefined rather than '', since <img src=""> re-requests the page.
export const assetUrl = (url) => (!url ? undefined : url.startsWith('/') ? `${BASE}${url}` : url);

/** Requests a resized Unsplash image; other URLs are returned untouched. */
export function sizedImage(url, width) {
  if (!url) return undefined;
  if (!url.includes('images.unsplash.com')) return assetUrl(url);
  const u = new URL(url);
  u.searchParams.set('w', String(width));
  return u.toString();
}
