import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
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
  WarehouseInboundListPage,
  WarehouseOutboundListPage,
  AssignedWarehouseInboundListPage,
  AssignedWarehouseOutboundListPage,
  WarehouseInboundApprovalPage,
  WarehouseOutboundApprovalPage,
} from '@/features/warehouse';
import { ShipmentCreatePage, ShipmentListPage, AssignedShipmentListPage, ShipmentCollectionPage, ShipmentApprovalPage } from '@/features/shipment';
import { Warehouse3dPage } from '@/features/inventory/3d-warehouse';
import { ParameterFormPage } from '@/features/parameters';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'goods-receipt',
        children: [
          {
            path: 'create',
            element: <GoodsReceiptCreatePage />,
          },
          {
            path: 'list',
            element: <GoodsReceiptListPage />,
          },
          {
            path: 'assigned',
            element: <AssignedGrListPage />,
          },
          {
            path: 'collection/:headerId',
            element: <GoodsReceiptCollectionPage />,
          },
        ],
      },
      {
        path: 'transfer',
        children: [
          {
            path: 'create',
            element: <TransferCreatePage />,
          },
          {
            path: 'list',
            element: <TransferListPage />,
          },
          {
            path: 'assigned',
            element: <AssignedTransferListPage />,
          },
          {
            path: 'collection/:headerId',
            element: <TransferCollectionPage />,
          },
          {
            path: 'collected/:headerId',
            element: <CollectedBarcodesPage />,
          },
          {
            path: 'approval',
            element: <TransferApprovalPage />,
          },
        ],
      },
      {
        path: 'subcontracting',
        children: [
          {
            path: 'issue',
            children: [
              {
                path: 'create',
                element: <SubcontractingIssueCreatePage />,
              },
              {
                path: 'list',
                element: <SubcontractingIssueListPage />,
              },
              {
                path: 'assigned',
                element: <AssignedSitListPage />,
              },
              {
                path: 'collection/:headerId',
                element: <SitCollectionPage />,
              },
              {
                path: 'approval',
                element: <SubcontractingIssueApprovalPage />,
              },
            ],
          },
          {
            path: 'receipt',
            children: [
              {
                path: 'create',
                element: <SubcontractingReceiptCreatePage />,
              },
              {
                path: 'list',
                element: <SubcontractingReceiptListPage />,
              },
              {
                path: 'assigned',
                element: <AssignedSrtListPage />,
              },
              {
                path: 'collection/:headerId',
                element: <SrtCollectionPage />,
              },
              {
                path: 'approval',
                element: <SubcontractingReceiptApprovalPage />,
              },
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
              {
                path: 'create',
                element: <WarehouseInboundCreatePage />,
              },
              {
                path: 'list',
                element: <WarehouseInboundListPage />,
              },
              {
                path: 'assigned',
                element: <AssignedWarehouseInboundListPage />,
              },
              {
                path: 'approval',
                element: <WarehouseInboundApprovalPage />,
              },
            ],
          },
          {
            path: 'outbound',
            children: [
              {
                path: 'create',
                element: <WarehouseOutboundCreatePage />,
              },
              {
                path: 'list',
                element: <WarehouseOutboundListPage />,
              },
              {
                path: 'assigned',
                element: <AssignedWarehouseOutboundListPage />,
              },
              {
                path: 'approval',
                element: <WarehouseOutboundApprovalPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'shipment',
        children: [
          {
            path: 'create',
            element: <ShipmentCreatePage />,
          },
          {
            path: 'list',
            element: <ShipmentListPage />,
          },
          {
            path: 'assigned',
            element: <AssignedShipmentListPage />,
          },
          {
            path: 'collection/:headerId',
            element: <ShipmentCollectionPage />,
          },
          {
            path: 'approval',
            element: <ShipmentApprovalPage />,
          },
        ],
      },
      {
        path: 'inventory',
        children: [
          {
            path: '3d-warehouse',
            element: <Warehouse3dPage />,
          },
        ],
      },
      {
        path: 'parameters',
        children: [
          {
            path: ':type',
            element: <ParameterFormPage />,
          },
        ],
      },
      {
        path: 'package',
        children: [
          {
            path: 'list',
            element: <PackageListPage />,
          },
          {
            path: 'create/:headerId?',
            element: <PackageCreatePage />,
          },
          {
            path: 'edit/:id',
            element: <PackageEditPage />,
          },
          {
            path: 'detail/:id',
            element: <PackageDetailPage />,
          },
          {
            path: 'package-detail/:id',
            element: <PackagePackageDetailPage />,
          },
        ],
      },
      {
        path: 'access-control',
        children: [
          {
            path: 'user-management',
            element: <UserManagementPage />,
          },
          {
            path: 'permission-definitions',
            element: <PermissionDefinitionsPage />,
          },
          {
            path: 'permission-groups',
            element: <PermissionGroupsPage />,
          },
          {
            path: 'user-group-assignments',
            element: <UserGroupAssignmentsPage />,
          },
        ],
      },
      {
        path: 'users',
        children: [
          {
            path: 'mail-settings',
            element: <MailSettingsPage />,
          },
        ],
      },
      {
        path: 'hangfire-monitoring',
        element: <HangfireMonitoringPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
]);
