import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CurrentUser } from '../../entities/user';
import { AuthGuard, RouteGuard } from './route-guard';

type MockAuthValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refreshProfile: ReturnType<typeof vi.fn>;
};

const authMocks = vi.hoisted(() => ({
  authValue: {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  } as MockAuthValue,
}));

vi.mock('../../features/auth', () => ({
  useAuth: () => authMocks.authValue,
}));

function renderWithRoutes(element: React.ReactNode, initialPath = '/finance') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/finance" element={element} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/forbidden" element={<div>Forbidden page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    authMocks.authValue = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };
  });

  it('renders loading state while auth is loading', () => {
    authMocks.authValue = {
      ...authMocks.authValue,
      isLoading: true,
    };

    renderWithRoutes(<AuthGuard><div>Private page</div></AuthGuard>);

    expect(screen.getByText('Loading workspace...')).toBeInTheDocument();
  });

  it('redirects anonymous users to login', () => {
    renderWithRoutes(<AuthGuard><div>Private page</div></AuthGuard>);

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Private page')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    authMocks.authValue = {
      ...authMocks.authValue,
      user: { id: 1, username: 'manager', email: 'm@example.com', role: 'manager', phone: null, address: null, company: 'Acme' },
      isAuthenticated: true,
    };

    renderWithRoutes(<AuthGuard><div>Private page</div></AuthGuard>);

    expect(screen.getByText('Private page')).toBeInTheDocument();
  });
});

describe('RouteGuard', () => {
  beforeEach(() => {
    authMocks.authValue = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    };
  });

  it('renders loading state while auth is loading', () => {
    authMocks.authValue = {
      ...authMocks.authValue,
      isLoading: true,
    };

    renderWithRoutes(<RouteGuard routeId="finance"><div>Finance page</div></RouteGuard>);

    expect(screen.getByText('Loading workspace...')).toBeInTheDocument();
  });

  it('redirects missing users to login', () => {
    renderWithRoutes(<RouteGuard routeId="finance"><div>Finance page</div></RouteGuard>);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects users without the allowed role to forbidden', () => {
    authMocks.authValue = {
      ...authMocks.authValue,
      user: { id: 2, username: 'client', email: 'c@example.com', role: 'client', phone: null, address: null, company: 'Acme' },
      isAuthenticated: true,
    };

    renderWithRoutes(<RouteGuard routeId="finance"><div>Finance page</div></RouteGuard>);

    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
    expect(screen.queryByText('Finance page')).not.toBeInTheDocument();
  });

  it('renders children for users with the allowed role', () => {
    authMocks.authValue = {
      ...authMocks.authValue,
      user: { id: 1, username: 'manager', email: 'm@example.com', role: 'manager', phone: null, address: null, company: 'Acme' },
      isAuthenticated: true,
    };

    renderWithRoutes(<RouteGuard routeId="finance"><div>Finance page</div></RouteGuard>);

    expect(screen.getByText('Finance page')).toBeInTheDocument();
  });
});
