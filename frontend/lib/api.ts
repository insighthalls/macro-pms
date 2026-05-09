/**
 * Tiny fetch wrapper for the backend-slice API.
 *  - Adds Authorization: Bearer <accessToken> from getToken()
 *  - Throws an ApiError-shaped Error on non-2xx
 *  - Routes through /api/* (proxied to backend in next.config.mjs)
 */

import type { ApiError } from './types';

const BASE = '/api';

let _token: string | null = null;
let _onAuthFailure: (() => void) | null = null;

export const setToken    = (t: string | null) => { _token = t; };
export const getToken    = () => _token;
export const onAuthFailure = (fn: () => void) => { _onAuthFailure = fn; };

class HttpError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  constructor(status: number, body: ApiError) {
    super(body.message || body.error);
    this.status = status;
    this.code = body.error;
    this.details = body.details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (_token) headers.set('Authorization', `Bearer ${_token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && _onAuthFailure) _onAuthFailure();
    throw new HttpError(res.status, data as ApiError);
  }
  return data as T;
}

export const api = {
  get:  <T>(p: string)              => request<T>(p),
  post: <T>(p: string, body?: unknown) => request<T>(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch:<T>(p: string, body?: unknown) => request<T>(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del:  <T>(p: string)              => request<T>(p, { method: 'DELETE' }),
};

export { HttpError };
