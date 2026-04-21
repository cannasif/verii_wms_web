import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const PermissionDefinitionsPage = lazyNamed(
  () => import('@/features/access-control/components/PermissionDefinitionsPage'),
  'PermissionDefinitionsPage',
);
const PermissionGroupsPage = lazyNamed(
  () => import('@/features/access-control/components/PermissionGroupsPage'),
  'PermissionGroupsPage',
);
const UserGroupAssignmentsPage = lazyNamed(
  () => import('@/features/access-control/components/UserGroupAssignmentsPage'),
  'UserGroupAssignmentsPage',
);
const UserManagementPage = lazyNamed(
  () => import('@/features/user-management/components/UserManagementPage'),
  'UserManagementPage',
);
const MailSettingsPage = lazyNamed(
  () => import('@/features/mail-settings/pages/MailSettingsPage'),
  'MailSettingsPage',
);
const HangfireMonitoringPage = lazyNamed(
  () => import('@/features/hangfire-monitoring/components/HangfireMonitoringPage'),
  'HangfireMonitoringPage',
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
];
