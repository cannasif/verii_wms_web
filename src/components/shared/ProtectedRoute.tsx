import { type ReactElement, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: ReactElement;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const isAuthenticatedFn = useAuthStore((state) => state.isAuthenticated);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  useEffect(() => {
    const result = isAuthenticatedFn();
    setIsAuthenticated(result);
    setHasChecked(true);
  }, [isAuthenticatedFn]);

  if (!hasChecked) return <></>;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

