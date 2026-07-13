import { getRuntimeConfig } from '../config.js';

// Thin typed fetch wrapper. All API calls go through this so URL, headers,
// error normalization, and cross-origin credentials sit in one place.

export class ApiError extends Error {
  constructor(
    public status: number,
    public reason: string,
    message?: string,
  ) {
    super(message ?? `${status} ${reason}`);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const { apiUrl } = getRuntimeConfig();
  const res = await fetch(apiUrl + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } : init?.headers,
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const reason = (isJson && typeof payload === 'object' && payload && 'reason' in payload
      ? (payload as { reason: string }).reason
      : String(payload).slice(0, 120)) || 'error';
    throw new ApiError(res.status, reason);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit): Promise<T> => request<T>('GET', path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> =>
    request<T>('POST', path, body, init),
};
