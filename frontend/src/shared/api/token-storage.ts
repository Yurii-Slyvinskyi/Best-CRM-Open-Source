const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

export type StoredTokens = {
  access: string;
  refresh: string;
};

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: StoredTokens) {
  updateTokens(tokens);
}

export function updateTokens(tokens: Partial<StoredTokens>) {
  if (tokens.access !== undefined) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }

  if (tokens.refresh !== undefined) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
