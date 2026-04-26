import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const GoodsReceiptCreatePage = lazyNamed(
  () => import('@/features/goods-receipt/components/GoodsReceiptCreatePage'),
  'GoodsReceiptCreatePage',
);
const GoodsReceiptProcessPage = lazyNamed(
  () => import('@/features/goods-receipt/components/GoodsReceiptProcessPage'),
  'GoodsReceiptProcessPage',
);
const GoodsReceiptListPage = lazyNamed(
  () => import('@/features/goods-receipt/components/GoodsReceiptListPage'),
  'GoodsReceiptListPage',
);
const AssignedGrListPage = lazyNamed(
  () => import('@/features/goods-receipt/components/AssignedGrListPage'),
  'AssignedGrListPage',
);
const GoodsReceiptCollectionPage = lazyNamed(
  () => import('@/features/goods-receipt/components/GoodsReceiptCollectionPage'),
  'GoodsReceiptCollectionPage',
);
const GoodsReceiptApprovalPage = lazyNamed(
  () => import('@/features/goods-receipt/components/GoodsReceiptApprovalPage'),
  'GoodsReceiptApprovalPage',
);

const TransferCreatePage = lazyNamed(
  () => import('@/features/transfer/components/TransferCreatePage'),
  'TransferCreatePage',
);
const TransferProcessPage = lazyNamed(
  () => import('@/features/transfer/components/TransferProcessPage'),
  'TransferProcessPage',
);
const TransferListPage = lazyNamed(
  () => import('@/features/transfer/components/TransferListPage'),
  'TransferListPage',
);
const AssignedTransferListPage = lazyNamed(
  () => import('@/features/transfer/components/AssignedTransferListPage'),
  'AssignedTransferListPage',
);
const TransferCollectionPage = lazyNamed(
  () => import('@/features/transfer/components/TransferCollectionPage'),
  'TransferCollectionPage',
);
const CollectedBarcodesPage = lazyNamed(
  () => import('@/features/transfer/components/CollectedBarcodesPage'),
  'CollectedBarcodesPage',
);
const TransferApprovalPage = lazyNamed(
  () => import('@/features/transfer/components/TransferApprovalPage'),
  'TransferApprovalPage',
);

const SubcontractingIssueCreatePage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueCreatePage');
const SubcontractingIssueProcessPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueProcessPage');
const SubcontractingReceiptCreatePage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptCreatePage');
const SubcontractingReceiptProcessPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptProcessPage');
const SubcontractingReceiptListPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptListPage');
const SubcontractingIssueListPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueListPage');
const AssignedSitListPage = lazyNamed(() => import('@/features/subcontracting'), 'AssignedSitListPage');
const AssignedSrtListPage = lazyNamed(() => import('@/features/subcontracting'), 'AssignedSrtListPage');
const SitCollectionPage = lazyNamed(() => import('@/features/subcontracting'), 'SitCollectionPage');
const SrtCollectionPage = lazyNamed(() => import('@/features/subcontracting'), 'SrtCollectionPage');
const SubcontractingIssueApprovalPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueApprovalPage');
const SubcontractingReceiptApprovalPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptApprovalPage');

const WarehouseInboundCreatePage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseInboundCreatePage'),
  'WarehouseInboundCreatePage',
);
const WarehouseInboundProcessPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseInboundProcessPage'),
  'WarehouseInboundProcessPage',
);
const WarehouseOutboundCreatePage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseOutboundCreatePage'),
  'WarehouseOutboundCreatePage',
);
const WarehouseOutboundProcessPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseOutboundProcessPage'),
  'WarehouseOutboundProcessPage',
);
const WarehouseInboundListPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseInboundListPage'),
  'WarehouseInboundListPage',
);
const WarehouseOutboundListPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseOutboundListPage'),
  'WarehouseOutboundListPage',
);
const AssignedWarehouseInboundListPage = lazyNamed(
  () => import('@/features/warehouse/components/AssignedWarehouseInboundListPage'),
  'AssignedWarehouseInboundListPage',
);
const AssignedWarehouseOutboundListPage = lazyNamed(
  () => import('@/features/warehouse/components/AssignedWarehouseOutboundListPage'),
  'AssignedWarehouseOutboundListPage',
);
const WarehouseInboundApprovalPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseInboundApprovalPage'),
  'WarehouseInboundApprovalPage',
);
const WarehouseOutboundApprovalPage = lazyNamed(
  () => import('@/features/warehouse/components/WarehouseOutboundApprovalPage'),
  'WarehouseOutboundApprovalPage',
);

const ShipmentCreatePage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentCreatePage'),
  'ShipmentCreatePage',
);
const ShipmentProcessPage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentProcessPage'),
  'ShipmentProcessPage',
);
const ShipmentListPage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentListPage'),
  'ShipmentListPage',
);
const AssignedShipmentListPage = lazyNamed(
  () => import('@/features/shipment/components/AssignedShipmentListPage'),
  'AssignedShipmentListPage',
);
const ShipmentCollectionPage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentCollectionPage'),
  'ShipmentCollectionPage',
);
const ShipmentApprovalPage = lazyNamed(
  () => import('@/features/shipment/components/ShipmentApprovalPage'),
  'ShipmentApprovalPage',
);

const AssignedProductionListPage = lazyNamed(() => import('@/features/production'), 'AssignedProductionListPage');
const ProductionCreatePage = lazyNamed(() => import('@/features/production'), 'ProductionCreatePage');
const ProductionDetailPage = lazyNamed(() => import('@/features/production'), 'ProductionDetailPage');
const ProductionListPage = lazyNamed(() => import('@/features/production'), 'ProductionListPage');
const ProductionProcessPage = lazyNamed(() => import('@/features/production'), 'ProductionProcessPage');
const ProductionApprovalPage = lazyNamed(() => import('@/features/production'), 'ProductionApprovalPage');

const ProductionTransferCreatePage = lazyNamed(() => import('@/features/production-transfer'), 'ProductionTransferCreatePage');
const ProductionTransferDetailPage = lazyNamed(() => import('@/features/production-transfer'), 'ProductionTransferDetailPage');
const ProductionTransferListPage = lazyNamed(() => import('@/features/production-transfer'), 'ProductionTransferListPage');
const ProductionTransferApprovalPage = lazyNamed(() => import('@/features/production-transfer'), 'ProductionTransferApprovalPage');

const AssignedInventoryCountListPage = lazyNamed(() => import('@/features/inventory-count'), 'AssignedInventoryCountListPage');
const InventoryCountCreatePage = lazyNamed(() => import('@/features/inventory-count'), 'InventoryCountCreatePage');
const InventoryCountListPage = lazyNamed(() => import('@/features/inventory-count'), 'InventoryCountListPage');
const InventoryCountProcessPage = lazyNamed(() => import('@/features/inventory-count'), 'InventoryCountProcessPage');

const Warehouse3dPage = lazyNamed(() => import('@/features/inventory/3d-warehouse'), 'Warehouse3dPage');
const OutsideWarehousePage = lazyNamed(() => import('@/features/inventory/3d-warehouse'), 'OutsideWarehousePage');

const PackageListPage = lazyNamed(
  () => import('@/features/package/components/PackageListPage'),
  'PackageListPage',
);
const PackageCreatePage = lazyNamed(
  () => import('@/features/package/components/PackageCreatePage'),
  'PackageCreatePage',
);
const PackageEditPage = lazyNamed(
  () => import('@/features/package/components/PackageEditPage'),
  'PackageEditPage',
);
const PackageDetailPage = lazyNamed(
  () => import('@/features/package/components/PackageDetailPage'),
  'PackageDetailPage',
);
const PackagePackageDetailPage = lazyNamed(
  () => import('@/features/package/components/PackagePackageDetailPage'),
  'PackagePackageDetailPage',
);

const AllocationQueuePage = lazyNamed(() => import('@/features/service-allocation'), 'AllocationQueuePage');
const DocumentLinksPage = lazyNamed(() => import('@/features/service-allocation'), 'DocumentLinksPage');
const ServiceCaseFormPage = lazyNamed(() => import('@/features/service-allocation'), 'ServiceCaseFormPage');
const ServiceCaseListPage = lazyNamed(() => import('@/features/service-allocation'), 'ServiceCaseListPage');
const ServiceCaseTimelinePage = lazyNamed(() => import('@/features/service-allocation'), 'ServiceCaseTimelinePage');
const ServiceReportsPage = lazyNamed(() => import('@/features/service-allocation'), 'ServiceReportsPage');
const KkdOverviewPage = lazyNamed(() => import('@/features/kkd'), 'KkdOverviewPage');
const KkdInitialOrderPage = lazyNamed(() => import('@/features/kkd'), 'KkdInitialOrderPage');
const KkdDistributionPage = lazyNamed(() => import('@/features/kkd'), 'KkdDistributionPage');
const KkdDistributionListPage = lazyNamed(() => import('@/features/kkd'), 'KkdDistributionListPage');
const KkdEntitlementCheckPage = lazyNamed(() => import('@/features/kkd'), 'KkdEntitlementCheckPage');
const KkdRemainingEntitlementsPage = lazyNamed(() => import('@/features/kkd'), 'KkdRemainingEntitlementsPage');
const KkdValidationLogPage = lazyNamed(() => import('@/features/kkd'), 'KkdValidationLogPage');
const KkdDepartmentReportPage = lazyNamed(() => import('@/features/kkd'), 'KkdDepartmentReportPage');
const KkdRoleReportPage = lazyNamed(() => import('@/features/kkd'), 'KkdRoleReportPage');
const KkdGroupReportPage = lazyNamed(() => import('@/features/kkd'), 'KkdGroupReportPage');
const SteelGoodReciptAcceptanseImportPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseImportPage');
const SteelGoodReciptAcceptanseListPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseListPage');
const SteelGoodReciptAcceptanseInspectionPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseInspectionPage');

export const operationsChildRoutes: RouteObject[] = [
  {
    path: 'sac-mal-kabul',
    children: [
      { path: 'import', element: withRoute(SteelGoodReciptAcceptanseImportPage, { routeName: 'sgra-import' }) },
      { path: 'list', element: withRoute(SteelGoodReciptAcceptanseListPage, { routeName: 'sgra-list' }) },
      { path: 'inspection', element: withRoute(SteelGoodReciptAcceptanseInspectionPage, { routeName: 'sgra-inspection' }) },
    ],
  },
  {
    path: 'kkd',
    children: [
      { index: true, element: withRoute(KkdOverviewPage, { routeName: 'kkd-overview' }) },
      { path: 'initial-order', element: withRoute(KkdInitialOrderPage, { routeName: 'kkd-initial-order' }) },
      { path: 'distribution', element: withRoute(KkdDistributionPage, { routeName: 'kkd-distribution' }) },
      { path: 'distribution-list', element: withRoute(KkdDistributionListPage, { routeName: 'kkd-distribution-list' }) },
      { path: 'remaining-entitlements', element: withRoute(KkdRemainingEntitlementsPage, { routeName: 'kkd-remaining-entitlements' }) },
      { path: 'entitlement-check', element: withRoute(KkdEntitlementCheckPage, { routeName: 'kkd-entitlement-check' }) },
      { path: 'validation-logs', element: withRoute(KkdValidationLogPage, { routeName: 'kkd-validation-logs' }) },
      { path: 'reports/departments', element: withRoute(KkdDepartmentReportPage, { routeName: 'kkd-department-report' }) },
      { path: 'reports/roles', element: withRoute(KkdRoleReportPage, { routeName: 'kkd-role-report' }) },
      { path: 'reports/groups', element: withRoute(KkdGroupReportPage, { routeName: 'kkd-group-report' }) },
    ],
  },
  {
    path: 'goods-receipt',
    children: [
      { path: 'create', element: withRoute(GoodsReceiptCreatePage, { routeName: 'goods-receipt-create' }) },
      { path: 'process', element: withRoute(GoodsReceiptProcessPage, { routeName: 'goods-receipt-process' }) },
      { path: 'list', element: withRoute(GoodsReceiptListPage, { routeName: 'goods-receipt-list' }) },
      { path: 'assigned', element: withRoute(AssignedGrListPage, { routeName: 'goods-receipt-assigned' }) },
      { path: 'approval', element: withRoute(GoodsReceiptApprovalPage, { routeName: 'goods-receipt-approval' }) },
      { path: 'collection/:headerId', element: withRoute(GoodsReceiptCollectionPage, { routeName: 'goods-receipt-collection' }) },
    ],
  },
  {
    path: 'transfer',
    children: [
      { path: 'create', element: withRoute(TransferCreatePage, { routeName: 'transfer-create' }) },
      { path: 'process', element: withRoute(TransferProcessPage, { routeName: 'transfer-process' }) },
      { path: 'list', element: withRoute(TransferListPage, { routeName: 'transfer-list' }) },
      { path: 'assigned', element: withRoute(AssignedTransferListPage, { routeName: 'transfer-assigned' }) },
      { path: 'collection/:headerId', element: withRoute(TransferCollectionPage, { routeName: 'transfer-collection' }) },
      { path: 'collected/:headerId', element: withRoute(CollectedBarcodesPage, { routeName: 'transfer-collected-barcodes' }) },
      { path: 'approval', element: withRoute(TransferApprovalPage, { routeName: 'transfer-approval' }) },
    ],
  },
  {
    path: 'subcontracting',
    children: [
      {
        path: 'issue',
        children: [
          { path: 'create', element: withRoute(SubcontractingIssueCreatePage, { routeName: 'subcontracting-issue-create' }) },
          { path: 'process', element: withRoute(SubcontractingIssueProcessPage, { routeName: 'subcontracting-issue-process' }) },
          { path: 'list', element: withRoute(SubcontractingIssueListPage, { routeName: 'subcontracting-issue-list' }) },
          { path: 'assigned', element: withRoute(AssignedSitListPage, { routeName: 'subcontracting-issue-assigned' }) },
          { path: 'collection/:headerId', element: withRoute(SitCollectionPage, { routeName: 'subcontracting-issue-collection' }) },
          { path: 'approval', element: withRoute(SubcontractingIssueApprovalPage, { routeName: 'subcontracting-issue-approval' }) },
        ],
      },
      {
        path: 'receipt',
        children: [
          { path: 'create', element: withRoute(SubcontractingReceiptCreatePage, { routeName: 'subcontracting-receipt-create' }) },
          { path: 'process', element: withRoute(SubcontractingReceiptProcessPage, { routeName: 'subcontracting-receipt-process' }) },
          { path: 'list', element: withRoute(SubcontractingReceiptListPage, { routeName: 'subcontracting-receipt-list' }) },
          { path: 'assigned', element: withRoute(AssignedSrtListPage, { routeName: 'subcontracting-receipt-assigned' }) },
          { path: 'collection/:headerId', element: withRoute(SrtCollectionPage, { routeName: 'subcontracting-receipt-collection' }) },
          { path: 'approval', element: withRoute(SubcontractingReceiptApprovalPage, { routeName: 'subcontracting-receipt-approval' }) },
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
          { path: 'create', element: withRoute(WarehouseInboundCreatePage, { routeName: 'warehouse-inbound-create' }) },
          { path: 'process', element: withRoute(WarehouseInboundProcessPage, { routeName: 'warehouse-inbound-process' }) },
          { path: 'list', element: withRoute(WarehouseInboundListPage, { routeName: 'warehouse-inbound-list' }) },
          { path: 'assigned', element: withRoute(AssignedWarehouseInboundListPage, { routeName: 'warehouse-inbound-assigned' }) },
          { path: 'approval', element: withRoute(WarehouseInboundApprovalPage, { routeName: 'warehouse-inbound-approval' }) },
        ],
      },
      {
        path: 'outbound',
        children: [
          { path: 'create', element: withRoute(WarehouseOutboundCreatePage, { routeName: 'warehouse-outbound-create' }) },
          { path: 'process', element: withRoute(WarehouseOutboundProcessPage, { routeName: 'warehouse-outbound-process' }) },
          { path: 'list', element: withRoute(WarehouseOutboundListPage, { routeName: 'warehouse-outbound-list' }) },
          { path: 'assigned', element: withRoute(AssignedWarehouseOutboundListPage, { routeName: 'warehouse-outbound-assigned' }) },
          { path: 'approval', element: withRoute(WarehouseOutboundApprovalPage, { routeName: 'warehouse-outbound-approval' }) },
        ],
      },
    ],
  },
  {
    path: 'shipment',
    children: [
      { path: 'create', element: withRoute(ShipmentCreatePage, { routeName: 'shipment-create' }) },
      { path: 'process', element: withRoute(ShipmentProcessPage, { routeName: 'shipment-process' }) },
      { path: 'list', element: withRoute(ShipmentListPage, { routeName: 'shipment-list' }) },
      { path: 'assigned', element: withRoute(AssignedShipmentListPage, { routeName: 'shipment-assigned' }) },
      { path: 'collection/:headerId', element: withRoute(ShipmentCollectionPage, { routeName: 'shipment-collection' }) },
      { path: 'approval', element: withRoute(ShipmentApprovalPage, { routeName: 'shipment-approval' }) },
    ],
  },
  {
    path: 'service-allocation',
    children: [
      { path: 'allocation-queue', element: withRoute(AllocationQueuePage, { routeName: 'service-allocation-queue' }) },
      { path: 'cases', element: withRoute(ServiceCaseListPage, { routeName: 'service-allocation-cases' }) },
      { path: 'cases/new', element: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-create' }) },
      { path: 'cases/:id', element: withRoute(ServiceCaseTimelinePage, { routeName: 'service-allocation-case-timeline' }) },
      { path: 'cases/:id/edit', element: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-edit' }) },
      { path: 'document-links', element: withRoute(DocumentLinksPage, { routeName: 'service-allocation-document-links' }) },
      { path: 'reports', element: withRoute(ServiceReportsPage, { routeName: 'service-allocation-reports' }) },
    ],
  },
  {
    path: 'production',
    children: [
      { path: 'create', element: withRoute(ProductionCreatePage, { routeName: 'production-create' }) },
      { path: 'detail/:id', element: withRoute(ProductionDetailPage, { routeName: 'production-detail' }) },
      { path: 'process/:id', element: withRoute(ProductionProcessPage, { routeName: 'production-process' }) },
      { path: 'list', element: withRoute(ProductionListPage, { routeName: 'production-list' }) },
      { path: 'assigned', element: withRoute(AssignedProductionListPage, { routeName: 'production-assigned' }) },
      { path: 'approval', element: withRoute(ProductionApprovalPage, { routeName: 'production-approval' }) },
    ],
  },
  {
    path: 'production-transfer',
    children: [
      { path: 'create', element: withRoute(ProductionTransferCreatePage, { routeName: 'production-transfer-create' }) },
      { path: 'detail/:id', element: withRoute(ProductionTransferDetailPage, { routeName: 'production-transfer-detail' }) },
      { path: 'list', element: withRoute(ProductionTransferListPage, { routeName: 'production-transfer-list' }) },
      { path: 'approval', element: withRoute(ProductionTransferApprovalPage, { routeName: 'production-transfer-approval' }) },
    ],
  },
  {
    path: 'inventory-count',
    children: [
      { path: 'create', element: withRoute(InventoryCountCreatePage, { routeName: 'inventory-count-create' }) },
      { path: 'process', element: withRoute(InventoryCountProcessPage, { routeName: 'inventory-count-process' }) },
      { path: 'list', element: withRoute(InventoryCountListPage, { routeName: 'inventory-count-list' }) },
      { path: 'assigned', element: withRoute(AssignedInventoryCountListPage, { routeName: 'inventory-count-assigned' }) },
    ],
  },
  {
    path: 'inventory',
    children: [
      { path: '3d-warehouse', element: withRoute(Warehouse3dPage, { routeName: 'warehouse-3d' }) },
      { path: '3d-outside-warehouse', element: withRoute(OutsideWarehousePage, { routeName: 'warehouse-3d-outside' }) },
    ],
  },
  {
    path: 'package',
    children: [
      { path: 'list', element: withRoute(PackageListPage, { routeName: 'package-list' }) },
      { path: 'create/:headerId?', element: withRoute(PackageCreatePage, { routeName: 'package-create' }) },
      { path: 'edit/:id', element: withRoute(PackageEditPage, { routeName: 'package-edit' }) },
      { path: 'detail/:id', element: withRoute(PackageDetailPage, { routeName: 'package-detail' }) },
      { path: 'package-detail/:id', element: withRoute(PackagePackageDetailPage, { routeName: 'package-package-detail' }) },
    ],
  },
];
