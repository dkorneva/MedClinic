import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { APP_ROUTES, getDefaultRouteByRole } from './routes';

export function RootRedirect() {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  return <Navigate to={getDefaultRouteByRole(role)} replace />;
}
