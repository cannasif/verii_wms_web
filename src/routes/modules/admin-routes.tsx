import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const PermissionDefinitionsPage = lazyNamed(
  () => import('@/features/access-control'),
  'PermissionDefinitionsPage',
);
const PermissionGroupsPage = lazyNamed(
  () => import('@/features/access-control'),
  'PermissionGroupsPage',
);
const UserGroupAssignmentsPage = lazyNamed(
  () => import('@/features/access-control'),
  'UserGroupAssignmentsPage',
);
const WmsScopePoliciesPage = lazyNamed(
  () => import('@/features/access-control'),
  'WmsScopePoliciesPage',
);
const WmsScopeAssignmentsPage = lazyNamed(
  () => import('@/features/access-control'),
  'WmsScopeAssignmentsPage',
);
const UserManagementPage = lazyNamed(
  () => import('@/features/user-management'),
  'UserManagementPage',
);
const MailSettingsPage = lazyNamed(() => import('@/features/mail-settings'), 'MailSettingsPage');
const HangfireMonitoringPage = lazyNamed(
  () => import('@/features/hangfire-monitoring'),
  'HangfireMonitoringPage',
);
const TraceExplorerPage = lazyNamed(
  () => import('@/features/trace-explorer'),
  'TraceExplorerPage',
);

export const adminChildRoutes: RouteObject[] = [
  {
    path: 'access-control',
    children: [
      {
        path: 'user-management',
        element: withRoute(UserManagementPage, {
          routeName: 'user-management',
          namespaces: ['user-management', 'common'],
        }),
      },
      {
        path: 'permission-definitions',
        element: withRoute(PermissionDefinitionsPage, {
          routeName: 'permission-definitions',
          namespaces: ['access-control', 'common'],
        }),
      },
      {
        path: 'permission-groups',
        element: withRoute(PermissionGroupsPage, {
          routeName: 'permission-groups',
          namespaces: ['access-control', 'common'],
        }),
      },
      {
        path: 'user-group-assignments',
        element: withRoute(UserGroupAssignmentsPage, {
          routeName: 'user-group-assignments',
          namespaces: ['access-control', 'common'],
        }),
      },
      {
        path: 'wms-scope-policies',
        element: withRoute(WmsScopePoliciesPage, {
          routeName: 'wms-scope-policies',
          namespaces: ['access-control', 'common'],
        }),
      },
      {
        path: 'wms-scope-assignments',
        element: withRoute(WmsScopeAssignmentsPage, {
          routeName: 'wms-scope-assignments',
          namespaces: ['access-control', 'common'],
        }),
      },
    ],
  },
  {
    path: 'users',
    children: [
      {
        path: 'mail-settings',
        element: withRoute(MailSettingsPage, {
          routeName: 'mail-settings',
          namespaces: ['mail-settings', 'common'],
        }),
      },
    ],
  },
  {
    path: 'hangfire-monitoring',
    element: withRoute(HangfireMonitoringPage, {
      routeName: 'hangfire-monitoring',
      namespaces: ['hangfire-monitoring', 'common'],
    }),
  },
  {
    path: 'trace-explorer',
    element: withRoute(TraceExplorerPage, {
      routeName: 'trace-explorer',
      namespaces: ['trace-explorer', 'common'],
    }),
  },
];
