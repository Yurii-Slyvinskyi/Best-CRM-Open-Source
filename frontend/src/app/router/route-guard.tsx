import { Navigate, useLocation } from 'react-router-dom';
import { routeAccess, type AppRouteId } from '../../entities/navigation';
import { hasRole } from '../../entities/user';
import { useAuth } from '../../features/auth';

type RouteGuardProps = {
  routeId: AppRouteId;
  children: React.ReactNode;
};

type AuthGuardProps = {
  children: React.ReactNode;
};

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm">
        Loading workspace...
      </div>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function RouteGuard({ routeId, children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const allowedRoles = routeAccess[routeId];

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
