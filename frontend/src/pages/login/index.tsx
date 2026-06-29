import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn } from 'lucide-react';
import { useAuth } from '../../features/auth';
import { getApiErrorMessage } from '../../shared/api';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [username, setUsername] = useState('demo_manager');
  const [password, setPassword] = useState('DemoPass_123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm">
          Loading session...
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-700">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">CRM portfolio</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-950">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Use seeded demo credentials to open the role-based workspace.
          </p>
        </div>

        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">
            Demo users: <span className="font-medium text-gray-950">demo_manager</span>,{' '}
            <span className="font-medium text-gray-950">demo_worker</span>,{' '}
            <span className="font-medium text-gray-950">demo_client</span>. Password:{' '}
            <span className="font-medium text-gray-950">DemoPass_123!</span>
          </div>
        </form>
      </section>
    </main>
  );
}
