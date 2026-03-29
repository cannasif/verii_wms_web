import { type ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { getAppBasePath } from '@/lib/api-config';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { WelcomePage } from '@/features/welcome';
import { DashboardPage } from '@/features/dashboard';
import {
  GoodsReceiptCreatePage,
  GoodsReceiptListPage,
  AssignedGrListPage,
  GoodsReceiptCollectionPage,
} from '@/features/goods-receipt';
import {
  TransferCreatePage,
  TransferListPage,
  AssignedTransferListPage,
  TransferCollectionPage,
  CollectedBarcodesPage,
  TransferApprovalPage,
} from '@/features/transfer';
import {
  SubcontractingIssueCreatePage,
  SubcontractingReceiptCreatePage,
  SubcontractingReceiptListPage,
  SubcontractingIssueListPage,
  AssignedSitListPage,
  AssignedSrtListPage,
  SitCollectionPage,
  SrtCollectionPage,
  SubcontractingIssueApprovalPage,
  SubcontractingReceiptApprovalPage,
} from '@/features/subcontracting';
import {
  WarehouseInboundCreatePage,
  WarehouseOutboundCreatePage,
  WarehouseOutboundProcessPage,
  WarehouseInboundListPage,
  WarehouseOutboundListPage,
  AssignedWarehouseInboundListPage,
  AssignedWarehouseOutboundListPage,
  WarehouseInboundApprovalPage,
  WarehouseOutboundApprovalPage,
} from '@/features/warehouse';
import {
  ShipmentCreatePage,
  ShipmentListPage,
  AssignedShipmentListPage,
  ShipmentCollectionPage,
  ShipmentApprovalPage,
} from '@/features/shipment';
import { Warehouse3dPage, OutsideWarehousePage } from '@/features/inventory/3d-warehouse';
import { ParameterFormPage } from '@/features/parameters';
import { ProfilePage } from '@/features/user-detail';
import {
  PackageListPage,
  PackageCreatePage,
  PackageEditPage,
  PackageDetailPage,
  PackagePackageDetailPage,
} from '@/features/package';
import {
  PermissionDefinitionsPage,
  PermissionGroupsPage,
  UserGroupAssignmentsPage,
} from '@/features/access-control';
import { UserManagementPage } from '@/features/user-management';
import { MailSettingsPage } from '@/features/mail-settings';
import { HangfireMonitoringPage } from '@/features/hangfire-monitoring';
import { RouteErrorPage } from './RouteErrorPage';

function withSuspense(element: ReactElement): ReactElement {
  return element;
}

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(<WelcomePage />),
      },
      {
        path: 'dashboard',
        element: withSuspense(<DashboardPage />),
      },
      {
        path: 'goods-receipt',
        children: [
          { path: 'create', element: withSuspense(<GoodsReceiptCreatePage />) },
          { path: 'list', element: withSuspense(<GoodsReceiptListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedGrListPage />) },
          { path: 'collection/:headerId', element: withSuspense(<GoodsReceiptCollectionPage />) },
        ],
      },
      {
        path: 'transfer',
        children: [
          { path: 'create', element: withSuspense(<TransferCreatePage />) },
          { path: 'list', element: withSuspense(<TransferListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedTransferListPage />) },
          { path: 'collection/:headerId', element: withSuspense(<TransferCollectionPage />) },
          { path: 'collected/:headerId', element: withSuspense(<CollectedBarcodesPage />) },
          { path: 'approval', element: withSuspense(<TransferApprovalPage />) },
        ],
      },
      {
        path: 'subcontracting',
        children: [
          {
            path: 'issue',
            children: [
              { path: 'create', element: withSuspense(<SubcontractingIssueCreatePage />) },
              { path: 'list', element: withSuspense(<SubcontractingIssueListPage />) },
              { path: 'assigned', element: withSuspense(<AssignedSitListPage />) },
              { path: 'collection/:headerId', element: withSuspense(<SitCollectionPage />) },
              { path: 'approval', element: withSuspense(<SubcontractingIssueApprovalPage />) },
            ],
          },
          {
            path: 'receipt',
            children: [
              { path: 'create', element: withSuspense(<SubcontractingReceiptCreatePage />) },
              { path: 'list', element: withSuspense(<SubcontractingReceiptListPage />) },
              { path: 'assigned', element: withSuspense(<AssignedSrtListPage />) },
              { path: 'collection/:headerId', element: withSuspense(<SrtCollectionPage />) },
              { path: 'approval', element: withSuspense(<SubcontractingReceiptApprovalPage />) },
            ],
          },
        ],
      },
      {
        path: 'warehouse',
        children: [
          {
            path: 'inbound',
            children: [
              { path: 'create', element: withSuspense(<WarehouseInboundCreatePage />) },
              { path: 'list', element: withSuspense(<WarehouseInboundListPage />) },
              { path: 'assigned', element: withSuspense(<AssignedWarehouseInboundListPage />) },
              { path: 'approval', element: withSuspense(<WarehouseInboundApprovalPage />) },
            ],
          },
          {
            path: 'outbound',
            children: [
              { path: 'create', element: withSuspense(<WarehouseOutboundCreatePage />) },
              { path: 'process', element: withSuspense(<WarehouseOutboundProcessPage />) },
              { path: 'list', element: withSuspense(<WarehouseOutboundListPage />) },
              { path: 'assigned', element: withSuspense(<AssignedWarehouseOutboundListPage />) },
              { path: 'approval', element: withSuspense(<WarehouseOutboundApprovalPage />) },
            ],
          },
        ],
      },
      {
        path: 'shipment',
        children: [
          { path: 'create', element: withSuspense(<ShipmentCreatePage />) },
          { path: 'list', element: withSuspense(<ShipmentListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedShipmentListPage />) },
          { path: 'collection/:headerId', element: withSuspense(<ShipmentCollectionPage />) },
          { path: 'approval', element: withSuspense(<ShipmentApprovalPage />) },
        ],
      },
      {
        path: 'inventory',
        children: [
          { path: '3d-warehouse', element: withSuspense(<Warehouse3dPage />) },
          { path: '3d-outside-warehouse', element: withSuspense(<OutsideWarehousePage />) },
        ],
      },
      {
        path: 'parameters',
        children: [{ path: ':type', element: withSuspense(<ParameterFormPage />) }],
      },
      {
        path: 'package',
        children: [
          { path: 'list', element: withSuspense(<PackageListPage />) },
          { path: 'create/:headerId?', element: withSuspense(<PackageCreatePage />) },
          { path: 'edit/:id', element: withSuspense(<PackageEditPage />) },
          { path: 'detail/:id', element: withSuspense(<PackageDetailPage />) },
          { path: 'package-detail/:id', element: withSuspense(<PackagePackageDetailPage />) },
        ],
      },
      {
        path: 'access-control',
        children: [
          { path: 'user-management', element: withSuspense(<UserManagementPage />) },
          { path: 'permission-definitions', element: withSuspense(<PermissionDefinitionsPage />) },
          { path: 'permission-groups', element: withSuspense(<PermissionGroupsPage />) },
          { path: 'user-group-assignments', element: withSuspense(<UserGroupAssignmentsPage />) },
        ],
      },
      {
        path: 'users',
        children: [{ path: 'mail-settings', element: withSuspense(<MailSettingsPage />) }],
      },
      {
        path: 'hangfire-monitoring',
        element: withSuspense(<HangfireMonitoringPage />),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />),
      },
    ],
  },
  {
    path: '/auth',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
    ],
  },
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
    ],
  },
], {
  basename: getAppBasePath(),
});
