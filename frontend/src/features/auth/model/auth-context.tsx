import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthProfile, loginUser, logoutUser } from '../../../entities/auth';
import type { AuthProfile, LoginCredentials } from '../../../entities/auth';
import type { CurrentUser, UserRole } from '../../../entities/user';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../../shared/api';

type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getRoleFromToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role as UserRole | undefined;
  } catch {
    return undefined;
  }
}

function normalizeProfile(profile: AuthProfile, accessToken: string): CurrentUser {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    company: profile.company,
    role: profile.role ?? getRoleFromToken(accessToken) ?? 'client',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (accessToken: string) => {
    const profile = await getAuthProfile();
    setUser(normalizeProfile(profile, getAccessToken() ?? accessToken));
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    loadProfile(accessToken)
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [loadProfile]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await loginUser(credentials);

    setTokens(tokens);
    await loadProfile(tokens.access);
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      clearTokens();
      setUser(null);
      throw new Error('Session expired. Please sign in again.');
    }

    await loadProfile(accessToken);
  }, [loadProfile]);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await logoutUser({ refresh });
      }
    } catch {
      // Local logout must complete even if the server-side token is already invalid.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshProfile,
  }), [isLoading, login, logout, refreshProfile, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
