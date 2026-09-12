const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1').replace(/\/$/, '');
const ACCESS_KEY = 'docnear_access_token';
const REFRESH_KEY = 'docnear_refresh_token';
export const AUTH_EXPIRED = 'docnear:auth-expired';
export class ApiError extends Error {
  constructor(message: string, public status: number, public data: unknown) { super(message); }
}
type Envelope<T> = { success: boolean; data: T; message?: string; errors?: unknown };
export type Page<T> = { results: T[]; count: number; next: string | null; previous: string | null };
let refreshPromise: Promise<string | null> | null = null;
export function getRefreshToken() { return sessionStorage.getItem(REFRESH_KEY); }
export function hasSession() { return !!getRefreshToken(); }
export function setAuthTokens(data: { access: string; refresh?: string }) {
  sessionStorage.setItem(ACCESS_KEY, data.access);
  if (data.refresh) sessionStorage.setItem(REFRESH_KEY, data.refresh);
}
export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  for (const key of [ACCESS_KEY, REFRESH_KEY, 'docnear_auth_token', 'docnear_user_profile', 'docnear_users_database']) localStorage.removeItem(key);
}
async function send<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 20000);
  try {
    const response = await fetch(API_BASE_URL + '/' + path.replace(/^\//, ''), { ...init, signal: controller.signal });
    if (response.status === 204) return undefined as T;
    const body: Envelope<T> = await response.json().catch(() => ({ message: 'Server javobini o‘qib bo‘lmadi' }));
    if (!response.ok || body.success === false) {
      const details = body.errors ? Object.entries(body.errors).map(([key, value]) => key + ': ' + String(value)).join('; ') : '';
      throw new ApiError([body.message || 'So‘rov bajarilmadi', details].filter(Boolean).join('. '), response.status, body);
    }
    if (body.success !== true) throw new ApiError('API javobi kutilgan formatda emas', response.status, body);
    return body.data;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
}
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refresh = getRefreshToken();
  if (!refresh) return null;
  refreshPromise = send<{ access: string; refresh?: string }>('auth/token/refresh/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }),
  }).then(data => { setAuthTokens(data); return data.access; }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}
export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const isAuthEntry = /^auth\/(login|register|request-otp|resend-otp|verify-otp|token\/refresh)\//.test(path);
  const access = sessionStorage.getItem(ACCESS_KEY);
  if (access && !isAuthEntry) headers.set('Authorization', 'Bearer ' + access);
  try { return await send<T>(path, { ...init, headers }); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401 && !isAuthEntry) {
      if (retry && getRefreshToken()) {
        let refreshed = false;
        try {
          refreshed = !!(await refreshAccessToken());
        } catch (refreshError) {
          if (!(refreshError instanceof ApiError) || refreshError.status >= 500) throw refreshError;
        }
        if (refreshed) return apiRequest<T>(path, init, false);
      }
      clearTokens();
      window.dispatchEvent(new Event(AUTH_EXPIRED));
    }
    throw error;
  }
}
export async function apiList<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  for (;;) {
    const data = await apiRequest<Page<T>>(path + (path.includes('?') ? '&' : '?') + 'page_size=100&page=' + page++);
    results.push(...data.results);
    if (!data.next) return results;
  }
}
export const apiBaseUrl = API_BASE_URL;
