import { type ReactElement } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { canAccessPath } from '../utils/hasPermission';
import { UnauthorizedPage } from './UnauthorizedPage';

export function RoutePermissionGuard(): ReactElement {
  const location = useLocation();
  const { data: permissions, isLoading, isError, error } = useMyPermissionsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (isError) {
    const statusCode = (error as AxiosError | null)?.response?.status;
    if (statusCode === 403) {
      return <UnauthorizedPage />;
    }
    return <Outlet />;
  }

  if (!permissions) {
    return <UnauthorizedPage />;
  }

  if (canAccessPath(permissions, location.pathname)) {
    return <Outlet />;
  }

  return <UnauthorizedPage />;
}
