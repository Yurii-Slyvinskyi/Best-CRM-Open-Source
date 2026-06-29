import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './api-client';

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

const fetchMock = vi.fn<typeof fetch>();

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getRequestHeaders(callIndex: number) {
  const options = fetchMock.mock.calls[callIndex][1] as RequestInit;

  return new Headers(options.headers);
}

function getRequestPathname(callIndex: number) {
  const url = fetchMock.mock.calls[callIndex][0] as string;

  return new URL(url).pathname;
}

describe('apiClient auth/session behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes the stored access token on authenticated requests', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiClient('/api/projects/');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getRequestPathname(0)).toBe('/api/projects/');
    expect(getRequestHeaders(0).get('Authorization')).toBe('Bearer access-token');
  });

  it('refreshes tokens and retries the original request after a 401 response', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Token expired.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'fresh-access' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const response = await apiClient<{ ok: boolean }>('/api/projects/');

    expect(response).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getRequestPathname(1)).toBe('/api/users/login/refresh/');
    expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ refresh: 'refresh-token' }));
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('fresh-access');
    expect(getRequestHeaders(2).get('Authorization')).toBe('Bearer fresh-access');
    expect(getRequestPathname(2)).toBe('/api/projects/');
  });

  it('stores a refreshed refresh token when the refresh response includes one', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'old-refresh');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Token expired.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'fresh-access', refresh: 'fresh-refresh' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiClient('/api/projects/');

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('fresh-access');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('fresh-refresh');
  });

  it('clears stored tokens and preserves session-expired behavior when refresh fails', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Token expired.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Refresh token invalid.' }, 401));

    let error: unknown;

    try {
      await apiClient('/api/projects/');
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      message: 'Session expired. Please sign in again.',
      status: 401,
    });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
