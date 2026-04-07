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
  GoodsReceiptProcessPage,
  GoodsReceiptListPage,
  AssignedGrListPage,
  GoodsReceiptCollectionPage,
  GoodsReceiptApprovalPage,
} from '@/features/goods-receipt';
import {
  TransferCreatePage,
  TransferProcessPage,
  TransferListPage,
  AssignedTransferListPage,
  TransferCollectionPage,
  CollectedBarcodesPage,
  TransferApprovalPage,
} from '@/features/transfer';
import {
  SubcontractingIssueCreatePage,
  SubcontractingIssueProcessPage,
  SubcontractingReceiptCreatePage,
  SubcontractingReceiptProcessPage,
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
  WarehouseInboundProcessPage,
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
  ShipmentProcessPage,
  ShipmentListPage,
  AssignedShipmentListPage,
  ShipmentCollectionPage,
  ShipmentApprovalPage,
} from '@/features/shipment';
import {
  AssignedProductionListPage,
  ProductionCreatePage,
  ProductionDetailPage,
  ProductionListPage,
  ProductionProcessPage,
  ProductionApprovalPage,
} from '@/features/production';
import {
  ProductionTransferCreatePage,
  ProductionTransferDetailPage,
  ProductionTransferListPage,
  ProductionTransferApprovalPage,
} from '@/features/production-transfer';
import {
  AssignedInventoryCountListPage,
  InventoryCountCreatePage,
  InventoryCountListPage,
  InventoryCountProcessPage,
} from '@/features/inventory-count';
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
import { CustomerReferencePage, StockReferencePage, WarehouseReferencePage, YapKodReferencePage } from '@/features/erp-reference';
import { BarcodeDefinitionsPage } from '@/features/barcode-definitions';
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
          { path: 'process', element: withSuspense(<GoodsReceiptProcessPage />) },
          { path: 'list', element: withSuspense(<GoodsReceiptListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedGrListPage />) },
          { path: 'approval', element: withSuspense(<GoodsReceiptApprovalPage />) },
          { path: 'collection/:headerId', element: withSuspense(<GoodsReceiptCollectionPage />) },
        ],
      },
      {
        path: 'transfer',
        children: [
          { path: 'create', element: withSuspense(<TransferCreatePage />) },
          { path: 'process', element: withSuspense(<TransferProcessPage />) },
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
              { path: 'process', element: withSuspense(<SubcontractingIssueProcessPage />) },
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
              { path: 'process', element: withSuspense(<SubcontractingReceiptProcessPage />) },
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
              { path: 'process', element: withSuspense(<WarehouseInboundProcessPage />) },
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
          { path: 'process', element: withSuspense(<ShipmentProcessPage />) },
          { path: 'list', element: withSuspense(<ShipmentListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedShipmentListPage />) },
          { path: 'collection/:headerId', element: withSuspense(<ShipmentCollectionPage />) },
          { path: 'approval', element: withSuspense(<ShipmentApprovalPage />) },
        ],
      },
      {
        path: 'production',
        children: [
          { path: 'create', element: withSuspense(<ProductionCreatePage />) },
          { path: 'detail/:id', element: withSuspense(<ProductionDetailPage />) },
          { path: 'process/:id', element: withSuspense(<ProductionProcessPage />) },
          { path: 'list', element: withSuspense(<ProductionListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedProductionListPage />) },
          { path: 'approval', element: withSuspense(<ProductionApprovalPage />) },
        ],
      },
      {
        path: 'production-transfer',
        children: [
          { path: 'create', element: withSuspense(<ProductionTransferCreatePage />) },
          { path: 'detail/:id', element: withSuspense(<ProductionTransferDetailPage />) },
          { path: 'list', element: withSuspense(<ProductionTransferListPage />) },
          { path: 'approval', element: withSuspense(<ProductionTransferApprovalPage />) },
        ],
      },
      {
        path: 'inventory-count',
        children: [
          { path: 'create', element: withSuspense(<InventoryCountCreatePage />) },
          { path: 'process', element: withSuspense(<InventoryCountProcessPage />) },
          { path: 'list', element: withSuspense(<InventoryCountListPage />) },
          { path: 'assigned', element: withSuspense(<AssignedInventoryCountListPage />) },
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
        path: 'erp',
        children: [
          { path: 'customers', element: withSuspense(<CustomerReferencePage />) },
          { path: 'stocks', element: withSuspense(<StockReferencePage />) },
          { path: 'warehouses', element: withSuspense(<WarehouseReferencePage />) },
          { path: 'yapkodlar', element: withSuspense(<YapKodReferencePage />) },
          { path: 'barcodes', element: withSuspense(<BarcodeDefinitionsPage />) },
        ],
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
