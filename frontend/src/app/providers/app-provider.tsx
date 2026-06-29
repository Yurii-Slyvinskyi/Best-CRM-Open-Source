import { AppRouter } from '../router';
import { AuthProvider } from '../../features/auth';

export function AppProvider() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
