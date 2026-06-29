import { clearTokens, getAccessToken, getRefreshToken, updateTokens } from './token-storage';

type ApiClientOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  skipAuthRefresh?: boolean;
  hasRetried?: boolean;
};

type RefreshTokenResponse = {
  access: string;
  refresh?: string;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_API_BASE_URL = typeof window === 'undefined' ? 'http://localhost:8000' : window.location.origin;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const REFRESH_TOKEN_PATH = '/api/users/login/refresh/';
const AUTH_REFRESH_BLOCKED_PATHS = new Set([
  '/api/users/login',
  '/api/users/login/refresh',
  '/api/users/logout',
]);

let refreshRequest: Promise<RefreshTokenResponse> | null = null;

function buildUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function normalizePath(path: string) {
  try {
    const baseUrl = typeof window === 'undefined' ? API_BASE_URL : window.location.origin;
    return new URL(buildUrl(path), baseUrl).pathname.replace(/\/+$/, '');
  } catch {
    return path.split('?')[0].replace(/\/+$/, '');
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data === 'object') {
    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }

    if ('error' in data && typeof data.error === 'string') {
      return data.error;
    }

    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }

    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return fallback;
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function canRefreshAuth(
  path: string,
  options: ApiClientOptions,
  refreshToken: string | null,
): refreshToken is string {
  if (!refreshToken || options.auth === false || options.skipAuthRefresh || options.hasRetried) {
    return false;
  }

  return !AUTH_REFRESH_BLOCKED_PATHS.has(normalizePath(path));
}

function refreshTokens(refresh: string) {
  if (!refreshRequest) {
    refreshRequest = apiClient<RefreshTokenResponse>(REFRESH_TOKEN_PATH, {
      method: 'POST',
      body: { refresh },
      auth: false,
      skipAuthRefresh: true,
    }).finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

export async function apiClient<TResponse>(path: string, options: ApiClientOptions = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  const hasFormDataBody = isFormDataBody(options.body);
  let requestBody: BodyInit | undefined;

  headers.set('Accept', 'application/json');

  if (options.body !== undefined && !hasFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body !== undefined) {
    requestBody = isFormDataBody(options.body)
      ? options.body
      : JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
  });

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = getRefreshToken();

      if (canRefreshAuth(path, options, refreshToken)) {
        try {
          const refreshedTokens = await refreshTokens(refreshToken);

          if (!refreshedTokens.access) {
            throw new ApiError('Session expired. Please sign in again.', 401, refreshedTokens);
          }

          updateTokens({
            access: refreshedTokens.access,
            refresh: refreshedTokens.refresh,
          });

          return apiClient<TResponse>(path, {
            ...options,
            hasRetried: true,
          });
        } catch (error) {
          clearTokens();
          throw new ApiError(
            'Session expired. Please sign in again.',
            401,
            error,
          );
        }
      }

      if (options.auth !== false) {
        clearTokens();
      }
    }

    throw new ApiError(
      getErrorMessage(data, 'Something went wrong. Please try again.'),
      response.status,
      data,
    );
  }

  return data as TResponse;
}
