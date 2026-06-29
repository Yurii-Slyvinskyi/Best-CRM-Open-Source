import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthProfile } from '../../../entities/auth';
import { AuthProvider, useAuth } from './auth-context';

const authApiMocks = vi.hoisted(() => ({
  getAuthProfile: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('../../../entities/auth', () => authApiMocks);

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

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

function makeProfile(overrides: Partial<AuthProfile> = {}): AuthProfile {
  return {
    id: 1,
    username: 'demo_manager',
    email: 'manager@example.com',
    role: 'manager',
    phone: null,
    address: null,
    company: 'Acme',
    ...overrides,
  };
}

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <p data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</p>
      <p data-testid="authenticated">{auth.isAuthenticated ? 'authenticated' : 'anonymous'}</p>
      <p data-testid="role">{auth.user?.role ?? 'no-user'}</p>
      <button
        type="button"
        onClick={() => {
          void auth.login({ username: 'demo_manager', password: 'DemoPass_123!' });
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          void auth.logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    authApiMocks.getAuthProfile.mockReset();
    authApiMocks.loginUser.mockReset();
    authApiMocks.logoutUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores login tokens and loads the authenticated profile', async () => {
    const user = userEvent.setup();

    authApiMocks.loginUser.mockResolvedValueOnce({
      access: 'access-token',
      refresh: 'refresh-token',
    });
    authApiMocks.getAuthProfile.mockResolvedValueOnce(makeProfile({ role: 'manager' }));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('role')).toHaveTextContent('manager');
    });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-token');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-token');
    expect(authApiMocks.getAuthProfile).toHaveBeenCalledTimes(1);
  });

  it('falls back to the JWT role when the profile does not include one', async () => {
    const user = userEvent.setup();
    const accessTokenWithWorkerRole = 'header.eyJyb2xlIjoid29ya2VyIn0=.signature';

    authApiMocks.loginUser.mockResolvedValueOnce({
      access: accessTokenWithWorkerRole,
      refresh: 'refresh-token',
    });
    authApiMocks.getAuthProfile.mockResolvedValueOnce({
      ...makeProfile(),
      role: undefined,
    } as unknown as AuthProfile);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('worker');
    });
  });

  it('clears stored tokens on logout', async () => {
    const user = userEvent.setup();

    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');
    authApiMocks.getAuthProfile.mockResolvedValueOnce(makeProfile());
    authApiMocks.logoutUser.mockResolvedValueOnce(undefined);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('anonymous');
      expect(screen.getByTestId('role')).toHaveTextContent('no-user');
    });
    expect(authApiMocks.logoutUser).toHaveBeenCalledWith({ refresh: 'refresh-token' });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('clears stored tokens even when server logout rejects', async () => {
    const user = userEvent.setup();

    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');
    authApiMocks.getAuthProfile.mockResolvedValueOnce(makeProfile());
    authApiMocks.logoutUser.mockRejectedValueOnce(new Error('Logout failed'));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('anonymous');
      expect(screen.getByTestId('role')).toHaveTextContent('no-user');
    });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
