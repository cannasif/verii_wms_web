import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import { getAppBasePath } from '@/lib/api-config';
import { RouteErrorPage } from './RouteErrorPage';
import { authRouteTrees } from './modules/auth-routes';
import { adminChildRoutes } from './modules/admin-routes';
import { erpChildRoutes } from './modules/erp-routes';
import { operationsChildRoutes } from './modules/operations-routes';
import { lazyNamed, withRoute } from './route-utils';

const WelcomePage = lazyNamed(() => import('@/features/welcome'), 'WelcomePage');
const DashboardPage = lazyNamed(() => import('@/features/dashboard'), 'DashboardPage');
const ParameterFormPage = lazyNamed(() => import('@/features/parameters'), 'ParameterFormPage');
const ProfilePage = lazyNamed(() => import('@/features/user-detail/components/ProfilePage'), 'ProfilePage');

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      errorElement: <RouteErrorPage />,
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: withRoute(WelcomePage, { routeName: 'welcome' }) },
        { path: 'dashboard', element: withRoute(DashboardPage, { routeName: 'dashboard' }) },
        ...operationsChildRoutes,
        {
          path: 'parameters',
          children: [{ path: ':type', element: withRoute(ParameterFormPage, { routeName: 'parameters-form' }) }],
        },
        ...adminChildRoutes,
        ...erpChildRoutes,
        { path: 'profile', element: withRoute(ProfilePage, { routeName: 'profile' }) },
      ],
    },
    ...authRouteTrees,
  ], {
    basename: getAppBasePath(),
  });
}
