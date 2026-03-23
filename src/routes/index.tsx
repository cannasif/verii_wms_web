import { Suspense, lazy, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { getAppBasePath } from '@/lib/api-config';

function lazyPage<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
): ComponentType {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as ComponentType };
  });
}

function withSuspense(element: ReactElement): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

const LoginPage = lazyPage(() => import('@/features/auth'), 'LoginPage');
const ForgotPasswordPage = lazyPage(() => import('@/features/auth'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyPage(() => import('@/features/auth'), 'ResetPasswordPage');
const WelcomePage = lazyPage(() => import('@/features/welcome'), 'WelcomePage');
const DashboardPage = lazyPage(() => import('@/features/dashboard'), 'DashboardPage');
const GoodsReceiptCreatePage = lazyPage(() => import('@/features/goods-receipt'), 'GoodsReceiptCreatePage');
const GoodsReceiptListPage = lazyPage(() => import('@/features/goods-receipt'), 'GoodsReceiptListPage');
const AssignedGrListPage = lazyPage(() => import('@/features/goods-receipt'), 'AssignedGrListPage');
const GoodsReceiptCollectionPage = lazyPage(() => import('@/features/goods-receipt'), 'GoodsReceiptCollectionPage');
const TransferCreatePage = lazyPage(() => import('@/features/transfer'), 'TransferCreatePage');
const TransferListPage = lazyPage(() => import('@/features/transfer'), 'TransferListPage');
const AssignedTransferListPage = lazyPage(() => import('@/features/transfer'), 'AssignedTransferListPage');
const TransferCollectionPage = lazyPage(() => import('@/features/transfer'), 'TransferCollectionPage');
const CollectedBarcodesPage = lazyPage(() => import('@/features/transfer'), 'CollectedBarcodesPage');
const TransferApprovalPage = lazyPage(() => import('@/features/transfer'), 'TransferApprovalPage');
const SubcontractingIssueCreatePage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingIssueCreatePage');
const SubcontractingReceiptCreatePage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingReceiptCreatePage');
const SubcontractingReceiptListPage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingReceiptListPage');
const SubcontractingIssueListPage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingIssueListPage');
const AssignedSitListPage = lazyPage(() => import('@/features/subcontracting'), 'AssignedSitListPage');
const AssignedSrtListPage = lazyPage(() => import('@/features/subcontracting'), 'AssignedSrtListPage');
const SitCollectionPage = lazyPage(() => import('@/features/subcontracting'), 'SitCollectionPage');
const SrtCollectionPage = lazyPage(() => import('@/features/subcontracting'), 'SrtCollectionPage');
const SubcontractingIssueApprovalPage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingIssueApprovalPage');
const SubcontractingReceiptApprovalPage = lazyPage(() => import('@/features/subcontracting'), 'SubcontractingReceiptApprovalPage');
const WarehouseInboundCreatePage = lazyPage(() => import('@/features/warehouse'), 'WarehouseInboundCreatePage');
const WarehouseOutboundCreatePage = lazyPage(() => import('@/features/warehouse'), 'WarehouseOutboundCreatePage');
const WarehouseInboundListPage = lazyPage(() => import('@/features/warehouse'), 'WarehouseInboundListPage');
const WarehouseOutboundListPage = lazyPage(() => import('@/features/warehouse'), 'WarehouseOutboundListPage');
const AssignedWarehouseInboundListPage = lazyPage(() => import('@/features/warehouse'), 'AssignedWarehouseInboundListPage');
const AssignedWarehouseOutboundListPage = lazyPage(() => import('@/features/warehouse'), 'AssignedWarehouseOutboundListPage');
const WarehouseInboundApprovalPage = lazyPage(() => import('@/features/warehouse'), 'WarehouseInboundApprovalPage');
const WarehouseOutboundApprovalPage = lazyPage(() => import('@/features/warehouse'), 'WarehouseOutboundApprovalPage');
const ShipmentCreatePage = lazyPage(() => import('@/features/shipment'), 'ShipmentCreatePage');
const ShipmentListPage = lazyPage(() => import('@/features/shipment'), 'ShipmentListPage');
const AssignedShipmentListPage = lazyPage(() => import('@/features/shipment'), 'AssignedShipmentListPage');
const ShipmentCollectionPage = lazyPage(() => import('@/features/shipment'), 'ShipmentCollectionPage');
const ShipmentApprovalPage = lazyPage(() => import('@/features/shipment'), 'ShipmentApprovalPage');
const Warehouse3dPage = lazyPage(() => import('@/features/inventory/3d-warehouse'), 'Warehouse3dPage');
const OutsideWarehousePage = lazyPage(() => import('@/features/inventory/3d-warehouse'), 'OutsideWarehousePage');
const ParameterFormPage = lazyPage(() => import('@/features/parameters'), 'ParameterFormPage');
const ProfilePage = lazyPage(() => import('@/features/user-detail'), 'ProfilePage');
const PackageListPage = lazyPage(() => import('@/features/package'), 'PackageListPage');
const PackageCreatePage = lazyPage(() => import('@/features/package'), 'PackageCreatePage');
const PackageEditPage = lazyPage(() => import('@/features/package'), 'PackageEditPage');
const PackageDetailPage = lazyPage(() => import('@/features/package'), 'PackageDetailPage');
const PackagePackageDetailPage = lazyPage(() => import('@/features/package'), 'PackagePackageDetailPage');
const PermissionDefinitionsPage = lazyPage(() => import('@/features/access-control'), 'PermissionDefinitionsPage');
const PermissionGroupsPage = lazyPage(() => import('@/features/access-control'), 'PermissionGroupsPage');
const UserGroupAssignmentsPage = lazyPage(() => import('@/features/access-control'), 'UserGroupAssignmentsPage');
const UserManagementPage = lazyPage(() => import('@/features/user-management'), 'UserManagementPage');
const MailSettingsPage = lazyPage(() => import('@/features/mail-settings'), 'MailSettingsPage');
const HangfireMonitoringPage = lazyPage(() => import('@/features/hangfire-monitoring'), 'HangfireMonitoringPage');

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
        element: withSuspense(<WelcomePage />),
      },
      {
        path: 'dashboard',
        element: withSuspense(<DashboardPage />),
      },
      {
        path: 'goods-receipt',
        children: [
          {
            path: 'create',
            element: withSuspense(<GoodsReceiptCreatePage />),
          },
          {
            path: 'list',
            element: withSuspense(<GoodsReceiptListPage />),
          },
          {
            path: 'assigned',
            element: withSuspense(<AssignedGrListPage />),
          },
          {
            path: 'collection/:headerId',
            element: withSuspense(<GoodsReceiptCollectionPage />),
          },
        ],
      },
      {
        path: 'transfer',
        children: [
          {
            path: 'create',
            element: withSuspense(<TransferCreatePage />),
          },
          {
            path: 'list',
            element: withSuspense(<TransferListPage />),
          },
          {
            path: 'assigned',
            element: withSuspense(<AssignedTransferListPage />),
          },
          {
            path: 'collection/:headerId',
            element: withSuspense(<TransferCollectionPage />),
          },
          {
            path: 'collected/:headerId',
            element: withSuspense(<CollectedBarcodesPage />),
          },
          {
            path: 'approval',
            element: withSuspense(<TransferApprovalPage />),
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
                element: withSuspense(<SubcontractingIssueCreatePage />),
              },
              {
                path: 'list',
                element: withSuspense(<SubcontractingIssueListPage />),
              },
              {
                path: 'assigned',
                element: withSuspense(<AssignedSitListPage />),
              },
              {
                path: 'collection/:headerId',
                element: withSuspense(<SitCollectionPage />),
              },
              {
                path: 'approval',
                element: withSuspense(<SubcontractingIssueApprovalPage />),
              },
            ],
          },
          {
            path: 'receipt',
            children: [
              {
                path: 'create',
                element: withSuspense(<SubcontractingReceiptCreatePage />),
              },
              {
                path: 'list',
                element: withSuspense(<SubcontractingReceiptListPage />),
              },
              {
                path: 'assigned',
                element: withSuspense(<AssignedSrtListPage />),
              },
              {
                path: 'collection/:headerId',
                element: withSuspense(<SrtCollectionPage />),
              },
              {
                path: 'approval',
                element: withSuspense(<SubcontractingReceiptApprovalPage />),
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
                element: withSuspense(<WarehouseInboundCreatePage />),
              },
              {
                path: 'list',
                element: withSuspense(<WarehouseInboundListPage />),
              },
              {
                path: 'assigned',
                element: withSuspense(<AssignedWarehouseInboundListPage />),
              },
              {
                path: 'approval',
                element: withSuspense(<WarehouseInboundApprovalPage />),
              },
            ],
          },
          {
            path: 'outbound',
            children: [
              {
                path: 'create',
                element: withSuspense(<WarehouseOutboundCreatePage />),
              },
              {
                path: 'list',
                element: withSuspense(<WarehouseOutboundListPage />),
              },
              {
                path: 'assigned',
                element: withSuspense(<AssignedWarehouseOutboundListPage />),
              },
              {
                path: 'approval',
                element: withSuspense(<WarehouseOutboundApprovalPage />),
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
            element: withSuspense(<ShipmentCreatePage />),
          },
          {
            path: 'list',
            element: withSuspense(<ShipmentListPage />),
          },
          {
            path: 'assigned',
            element: withSuspense(<AssignedShipmentListPage />),
          },
          {
            path: 'collection/:headerId',
            element: withSuspense(<ShipmentCollectionPage />),
          },
          {
            path: 'approval',
            element: withSuspense(<ShipmentApprovalPage />),
          },
        ],
      },
      {
        path: 'inventory',
        children: [
          {
            path: '3d-warehouse',
            element: withSuspense(<Warehouse3dPage />),
          },
          {
            path: '3d-outside-warehouse',
            element: withSuspense(<OutsideWarehousePage />),
          },
        ],
      },
      {
        path: 'parameters',
        children: [
          {
            path: ':type',
            element: withSuspense(<ParameterFormPage />),
          },
        ],
      },
      {
        path: 'package',
        children: [
          {
            path: 'list',
            element: withSuspense(<PackageListPage />),
          },
          {
            path: 'create/:headerId?',
            element: withSuspense(<PackageCreatePage />),
          },
          {
            path: 'edit/:id',
            element: withSuspense(<PackageEditPage />),
          },
          {
            path: 'detail/:id',
            element: withSuspense(<PackageDetailPage />),
          },
          {
            path: 'package-detail/:id',
            element: withSuspense(<PackagePackageDetailPage />),
          },
        ],
      },
      {
        path: 'access-control',
        children: [
          {
            path: 'user-management',
            element: withSuspense(<UserManagementPage />),
          },
          {
            path: 'permission-definitions',
            element: withSuspense(<PermissionDefinitionsPage />),
          },
          {
            path: 'permission-groups',
            element: withSuspense(<PermissionGroupsPage />),
          },
          {
            path: 'user-group-assignments',
            element: withSuspense(<UserGroupAssignmentsPage />),
          },
        ],
      },
      {
        path: 'users',
        children: [
          {
            path: 'mail-settings',
            element: withSuspense(<MailSettingsPage />),
          },
        ],
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
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: 'forgot-password',
        element: withSuspense(<ForgotPasswordPage />),
      },
      {
        path: 'reset-password',
        element: withSuspense(<ResetPasswordPage />),
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'forgot-password',
        element: withSuspense(<ForgotPasswordPage />),
      },
      {
        path: 'reset-password',
        element: withSuspense(<ResetPasswordPage />),
      },
    ],
  },
], {
  basename: getAppBasePath(),
});
