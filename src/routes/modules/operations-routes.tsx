import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const GoodsReceiptCreatePage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptCreatePage',
);
const GoodsReceiptEditPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptEditPage',
);
const GoodsReceiptProcessPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptProcessPage',
);
const GoodsReceiptListPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptListPage',
);
const AssignedGrListPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'AssignedGrListPage',
);
const GoodsReceiptCollectionPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptCollectionPage',
);
const GoodsReceiptApprovalPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptApprovalPage',
);
const GoodsReceiptPreReceiptLabelsPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptPreReceiptLabelsPage',
);
const GoodsReceiptPreLabelReceivingPage = lazyNamed(
  () => import('@/features/goods-receipt'),
  'GoodsReceiptPreLabelReceivingPage',
);

const TransferCreatePage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferCreatePage',
);
const TransferEditPage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferEditPage',
);
const TransferProcessPage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferProcessPage',
);
const TransferListPage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferListPage',
);
const AssignedTransferListPage = lazyNamed(
  () => import('@/features/transfer'),
  'AssignedTransferListPage',
);
const TransferCollectionPage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferCollectionPage',
);
const CollectedBarcodesPage = lazyNamed(
  () => import('@/features/transfer'),
  'CollectedBarcodesPage',
);
const TransferApprovalPage = lazyNamed(
  () => import('@/features/transfer'),
  'TransferApprovalPage',
);
const TransferChainListPage = lazyNamed(() => import('@/features/transfer-chain'), 'TransferChainListPage');
const BilginogluHakEdisPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisPage');
const BilginogluHakEdisLocationSettingsPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisLocationSettingsPage');
const BilginogluHakEdisOperationSettingsPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisOperationSettingsPage');
const BilginogluHakEdisOrderSummaryReportPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisOrderSummaryReportPage');
const BilginogluHakEdisPendingTransfersPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisPendingTransfersPage');
const BilginogluHakEdisPendingShipmentsPage = lazyNamed(() => import('@/features/bilginoglu-hakedis'), 'BilginogluHakEdisPendingShipmentsPage');

const SubcontractingIssueCreatePage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueCreatePage');
const SubcontractingIssueEditPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueEditPage');
const SubcontractingIssueProcessPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingIssueProcessPage');
const SubcontractingReceiptCreatePage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptCreatePage');
const SubcontractingReceiptEditPage = lazyNamed(() => import('@/features/subcontracting'), 'SubcontractingReceiptEditPage');
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
  () => import('@/features/warehouse'),
  'WarehouseInboundCreatePage',
);
const WarehouseInboundEditPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseInboundEditPage',
);
const WarehouseInboundProcessPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseInboundProcessPage',
);
const WarehouseOutboundCreatePage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseOutboundCreatePage',
);
const WarehouseOutboundEditPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseOutboundEditPage',
);
const WarehouseOutboundProcessPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseOutboundProcessPage',
);
const WarehouseInboundListPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseInboundListPage',
);
const WarehouseOutboundListPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseOutboundListPage',
);
const AssignedWarehouseInboundListPage = lazyNamed(
  () => import('@/features/warehouse'),
  'AssignedWarehouseInboundListPage',
);
const AssignedWarehouseOutboundListPage = lazyNamed(
  () => import('@/features/warehouse'),
  'AssignedWarehouseOutboundListPage',
);
const WarehouseInboundApprovalPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseInboundApprovalPage',
);
const WarehouseOutboundApprovalPage = lazyNamed(
  () => import('@/features/warehouse'),
  'WarehouseOutboundApprovalPage',
);

const ShipmentCreatePage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentCreatePage',
);
const ShipmentEditPage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentEditPage',
);
const ShipmentProcessPage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentProcessPage',
);
const ShipmentListPage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentListPage',
);
const AssignedShipmentListPage = lazyNamed(
  () => import('@/features/shipment'),
  'AssignedShipmentListPage',
);
const ShipmentCollectionPage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentCollectionPage',
);
const ShipmentApprovalPage = lazyNamed(
  () => import('@/features/shipment'),
  'ShipmentApprovalPage',
);
const ShipmentLoadingPage = lazyNamed(
  () => import('@/features/shipment-loading'),
  'ShipmentLoadingPage',
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

const Warehouse3dPage = lazyNamed(() => import('@/features/warehouse-3d'), 'Warehouse3dPage');
const OutsideWarehousePage = lazyNamed(() => import('@/features/warehouse-3d'), 'OutsideWarehousePage');

const PackageListPage = lazyNamed(
  () => import('@/features/package'),
  'PackageListPage',
);
const PackageCreatePage = lazyNamed(
  () => import('@/features/package'),
  'PackageCreatePage',
);
const PackageEditPage = lazyNamed(
  () => import('@/features/package'),
  'PackageEditPage',
);
const PackageDetailPage = lazyNamed(
  () => import('@/features/package'),
  'PackageDetailPage',
);
const PackagePackageDetailPage = lazyNamed(
  () => import('@/features/package'),
  'PackagePackageDetailPage',
);
const PackagingSettingsPage = lazyNamed(
  () => import('@/features/package'),
  'PackagingSettingsPage',
);
const PackagePackingStationPage = lazyNamed(
  () => import('@/features/package'),
  'PackagePackingStationPage',
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
const VehicleCheckInPage = lazyNamed(() => import('@/features/vehicle-check-in'), 'VehicleCheckInPage');
const VehicleCheckInListPage = lazyNamed(() => import('@/features/vehicle-check-in'), 'VehicleCheckInListPage');
const OcrGoodsReceiptMatchPage = lazyNamed(() => import('@/features/ocr-goods-receipt-match'), 'OcrGoodsReceiptMatchPage');
const OcrGoodsReceiptMatchListPage = lazyNamed(() => import('@/features/ocr-goods-receipt-match'), 'OcrGoodsReceiptMatchListPage');
const QualityControlRulePage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlRulePage');
const QualityControlRuleListPage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlRuleListPage');
const QualityControlInspectionPage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlInspectionPage');
const QualityControlInspectionListPage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlInspectionListPage');
const QualityControlQuarantineQueuePage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlQuarantineQueuePage');
const QualityControlSettingsPage = lazyNamed(() => import('@/features/quality-control'), 'QualityControlSettingsPage');
const SteelGoodReciptAcceptanseImportPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseImportPage');
const SteelGoodReciptAcceptanseListPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseListPage');
const SteelGoodReciptAcceptanseInspectionPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseInspectionPage');
const SteelGoodReciptAcceptanseReceiptPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptanseReceiptPage');
const SteelGoodReciptAcceptansePlacementPage = lazyNamed(() => import('@/features/steel-good-recipt-acceptanse'), 'SteelGoodReciptAcceptansePlacementPage');

export const operationsChildRoutes: RouteObject[] = [
  { path: 'vehicle-check-in', Component: withRoute(VehicleCheckInPage, { routeName: 'vehicle-check-in' }) },
  { path: 'vehicle-check-in/list', Component: withRoute(VehicleCheckInListPage, { routeName: 'vehicle-check-in-list' }) },
  { path: 'ocr-goods-receipt-match', Component: withRoute(OcrGoodsReceiptMatchPage, { routeName: 'ocr-goods-receipt-match' }) },
  { path: 'ocr-goods-receipt-match/list', Component: withRoute(OcrGoodsReceiptMatchListPage, { routeName: 'ocr-goods-receipt-match-list' }) },
  { path: 'quality-control/rules/list', Component: withRoute(QualityControlRuleListPage, { routeName: 'quality-control-rules-list', namespaces: ['common'] }) },
  { path: 'quality-control/rules', Component: withRoute(QualityControlRulePage, { routeName: 'quality-control-rules', namespaces: ['common'] }) },
  { path: 'quality-control/settings', Component: withRoute(QualityControlSettingsPage, { routeName: 'quality-control-settings', namespaces: ['common'] }) },
  { path: 'quality-control/inspections/list', Component: withRoute(QualityControlInspectionListPage, { routeName: 'quality-control-inspections-list', namespaces: ['common'] }) },
  { path: 'quality-control/inspections', Component: withRoute(QualityControlInspectionPage, { routeName: 'quality-control-inspections', namespaces: ['common'] }) },
  { path: 'quality-control/quarantine', Component: withRoute(QualityControlQuarantineQueuePage, { routeName: 'quality-control-quarantine', namespaces: ['common'] }) },
  {
    path: 'sac-mal-kabul/import',
    Component: withRoute(SteelGoodReciptAcceptanseImportPage, { routeName: 'sgra-import' }),
  },
  {
    path: 'sac-mal-kabul/list',
    Component: withRoute(SteelGoodReciptAcceptanseListPage, { routeName: 'sgra-list' }),
  },
  {
    path: 'sac-mal-kabul/inspection',
    Component: withRoute(SteelGoodReciptAcceptanseInspectionPage, { routeName: 'sgra-inspection' }),
  },
  {
    path: 'sac-mal-kabul/receipt',
    Component: withRoute(SteelGoodReciptAcceptanseReceiptPage, { routeName: 'sgra-receipt' }),
  },
  {
    path: 'sac-mal-kabul/placement',
    Component: withRoute(SteelGoodReciptAcceptansePlacementPage, { routeName: 'sgra-placement' }),
  },
  { path: 'kkd', Component: withRoute(KkdOverviewPage, { routeName: 'kkd-overview', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/initial-order', Component: withRoute(KkdInitialOrderPage, { routeName: 'kkd-initial-order', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/distribution', Component: withRoute(KkdDistributionPage, { routeName: 'kkd-distribution', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/distribution-list', Component: withRoute(KkdDistributionListPage, { routeName: 'kkd-distribution-list', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/remaining-entitlements', Component: withRoute(KkdRemainingEntitlementsPage, { routeName: 'kkd-remaining-entitlements', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/entitlement-check', Component: withRoute(KkdEntitlementCheckPage, { routeName: 'kkd-entitlement-check', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/validation-logs', Component: withRoute(KkdValidationLogPage, { routeName: 'kkd-validation-logs', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/reports/departments', Component: withRoute(KkdDepartmentReportPage, { routeName: 'kkd-department-report', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/reports/roles', Component: withRoute(KkdRoleReportPage, { routeName: 'kkd-role-report', namespaces: ['kkd', 'common'] }) },
  { path: 'kkd/reports/groups', Component: withRoute(KkdGroupReportPage, { routeName: 'kkd-group-report', namespaces: ['kkd', 'common'] }) },
  {
    path: 'goods-receipt',
    children: [
      { path: 'create', Component: withRoute(GoodsReceiptCreatePage, { routeName: 'goods-receipt-create', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'edit/:id', Component: withRoute(GoodsReceiptEditPage, { routeName: 'goods-receipt-edit', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'process', Component: withRoute(GoodsReceiptProcessPage, { routeName: 'goods-receipt-process', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'list', Component: withRoute(GoodsReceiptListPage, { routeName: 'goods-receipt-list', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'assigned', Component: withRoute(AssignedGrListPage, { routeName: 'goods-receipt-assigned', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'approval', Component: withRoute(GoodsReceiptApprovalPage, { routeName: 'goods-receipt-approval', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'pre-labels', Component: withRoute(GoodsReceiptPreReceiptLabelsPage, { routeName: 'goods-receipt-pre-labels', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'pre-label-receiving', Component: withRoute(GoodsReceiptPreLabelReceivingPage, { routeName: 'goods-receipt-pre-label-receiving', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'collection/:headerId', Component: withRoute(GoodsReceiptCollectionPage, { routeName: 'goods-receipt-collection', namespaces: ['goods-receipt', 'common'] }) },
    ],
  },
  {
    path: 'transfer',
    children: [
      { path: 'create', Component: withRoute(TransferCreatePage, { routeName: 'transfer-create', namespaces: ['transfer', 'common'] }) },
      { path: 'edit/:id', Component: withRoute(TransferEditPage, { routeName: 'transfer-edit', namespaces: ['transfer', 'common'] }) },
      { path: 'process', Component: withRoute(TransferProcessPage, { routeName: 'transfer-process', namespaces: ['transfer', 'common'] }) },
      { path: 'list', Component: withRoute(TransferListPage, { routeName: 'transfer-list', namespaces: ['transfer', 'common'] }) },
      { path: 'assigned', Component: withRoute(AssignedTransferListPage, { routeName: 'transfer-assigned', namespaces: ['transfer', 'common'] }) },
      { path: 'collection/:headerId', Component: withRoute(TransferCollectionPage, { routeName: 'transfer-collection', namespaces: ['transfer', 'transfer-chain', 'common'] }) },
      { path: 'collected/:headerId', Component: withRoute(CollectedBarcodesPage, { routeName: 'transfer-collected-barcodes', namespaces: ['transfer', 'common'] }) },
      { path: 'approval', Component: withRoute(TransferApprovalPage, { routeName: 'transfer-approval', namespaces: ['transfer', 'common'] }) },
      { path: 'chains', Component: withRoute(TransferChainListPage, { routeName: 'transfer-chain-list', namespaces: ['transfer-chain', 'common'] }) },
      {
        path: 'bilginoglu-hakedis',
        element: <Navigate to="/service-allocation/bilginoglu-hakedis/open" replace />,
      },
    ],
  },
  {
    path: 'subcontracting',
    children: [
      {
        path: 'issue',
        children: [
          { path: 'create', Component: withRoute(SubcontractingIssueCreatePage, { routeName: 'subcontracting-issue-create', namespaces: ['subcontracting', 'common'] }) },
          { path: 'edit/:id', Component: withRoute(SubcontractingIssueEditPage, { routeName: 'subcontracting-issue-edit', namespaces: ['subcontracting', 'common'] }) },
          { path: 'process', Component: withRoute(SubcontractingIssueProcessPage, { routeName: 'subcontracting-issue-process', namespaces: ['subcontracting', 'common'] }) },
          { path: 'list', Component: withRoute(SubcontractingIssueListPage, { routeName: 'subcontracting-issue-list', namespaces: ['subcontracting', 'common'] }) },
          { path: 'assigned', Component: withRoute(AssignedSitListPage, { routeName: 'subcontracting-issue-assigned', namespaces: ['subcontracting', 'common'] }) },
          { path: 'collection/:headerId', Component: withRoute(SitCollectionPage, { routeName: 'subcontracting-issue-collection', namespaces: ['subcontracting', 'common'] }) },
          { path: 'approval', Component: withRoute(SubcontractingIssueApprovalPage, { routeName: 'subcontracting-issue-approval', namespaces: ['subcontracting', 'common'] }) },
        ],
      },
      {
        path: 'receipt',
        children: [
          { path: 'create', Component: withRoute(SubcontractingReceiptCreatePage, { routeName: 'subcontracting-receipt-create', namespaces: ['subcontracting', 'common'] }) },
          { path: 'edit/:id', Component: withRoute(SubcontractingReceiptEditPage, { routeName: 'subcontracting-receipt-edit', namespaces: ['subcontracting', 'common'] }) },
          { path: 'process', Component: withRoute(SubcontractingReceiptProcessPage, { routeName: 'subcontracting-receipt-process', namespaces: ['subcontracting', 'common'] }) },
          { path: 'list', Component: withRoute(SubcontractingReceiptListPage, { routeName: 'subcontracting-receipt-list', namespaces: ['subcontracting', 'common'] }) },
          { path: 'assigned', Component: withRoute(AssignedSrtListPage, { routeName: 'subcontracting-receipt-assigned', namespaces: ['subcontracting', 'common'] }) },
          { path: 'collection/:headerId', Component: withRoute(SrtCollectionPage, { routeName: 'subcontracting-receipt-collection', namespaces: ['subcontracting', 'common'] }) },
          { path: 'approval', Component: withRoute(SubcontractingReceiptApprovalPage, { routeName: 'subcontracting-receipt-approval', namespaces: ['subcontracting', 'common'] }) },
        ],
      },
    ],
  },
  {
    path: 'warehouse/inbound/create',
    Component: withRoute(WarehouseInboundCreatePage, { routeName: 'warehouse-inbound-create', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/inbound/edit/:id',
    Component: withRoute(WarehouseInboundEditPage, { routeName: 'warehouse-inbound-edit', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/inbound/process',
    Component: withRoute(WarehouseInboundProcessPage, { routeName: 'warehouse-inbound-process', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/inbound/list',
    Component: withRoute(WarehouseInboundListPage, { routeName: 'warehouse-inbound-list', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/inbound/assigned',
    Component: withRoute(AssignedWarehouseInboundListPage, { routeName: 'warehouse-inbound-assigned', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/inbound/approval',
    Component: withRoute(WarehouseInboundApprovalPage, { routeName: 'warehouse-inbound-approval', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/create',
    Component: withRoute(WarehouseOutboundCreatePage, { routeName: 'warehouse-outbound-create', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/edit/:id',
    Component: withRoute(WarehouseOutboundEditPage, { routeName: 'warehouse-outbound-edit', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/process',
    Component: withRoute(WarehouseOutboundProcessPage, { routeName: 'warehouse-outbound-process', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/list',
    Component: withRoute(WarehouseOutboundListPage, { routeName: 'warehouse-outbound-list', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/assigned',
    Component: withRoute(AssignedWarehouseOutboundListPage, { routeName: 'warehouse-outbound-assigned', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'warehouse/outbound/approval',
    Component: withRoute(WarehouseOutboundApprovalPage, { routeName: 'warehouse-outbound-approval', namespaces: ['warehouse', 'common'] }),
  },
  {
    path: 'shipment',
    children: [
      { path: 'create', Component: withRoute(ShipmentCreatePage, { routeName: 'shipment-create', namespaces: ['shipment', 'common'] }) },
      { path: 'edit/:id', Component: withRoute(ShipmentEditPage, { routeName: 'shipment-edit', namespaces: ['shipment', 'common'] }) },
      { path: 'process', Component: withRoute(ShipmentProcessPage, { routeName: 'shipment-process', namespaces: ['shipment', 'common'] }) },
      { path: 'list', Component: withRoute(ShipmentListPage, { routeName: 'shipment-list', namespaces: ['shipment', 'common'] }) },
      { path: 'assigned', Component: withRoute(AssignedShipmentListPage, { routeName: 'shipment-assigned', namespaces: ['shipment', 'common'] }) },
      { path: 'collection/:headerId', Component: withRoute(ShipmentCollectionPage, { routeName: 'shipment-collection', namespaces: ['shipment', 'transfer-chain', 'common'] }) },
      { path: 'loading', Component: withRoute(ShipmentLoadingPage, { routeName: 'shipment-loading', namespaces: ['shipment-loading', 'common'] }) },
      { path: 'approval', Component: withRoute(ShipmentApprovalPage, { routeName: 'shipment-approval', namespaces: ['shipment', 'common'] }) },
    ],
  },
  {
    path: 'service-allocation/allocation-queue',
    Component: withRoute(AllocationQueuePage, { routeName: 'service-allocation-queue', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/cases',
    Component: withRoute(ServiceCaseListPage, { routeName: 'service-allocation-cases', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/cases/new',
    Component: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-create', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/cases/:id/edit',
    Component: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-edit', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/cases/:id',
    Component: withRoute(ServiceCaseTimelinePage, { routeName: 'service-allocation-case-timeline', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/document-links',
    Component: withRoute(DocumentLinksPage, { routeName: 'service-allocation-document-links', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/reports',
    Component: withRoute(ServiceReportsPage, { routeName: 'service-allocation-reports', namespaces: ['service-allocation', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/open',
    Component: withRoute(BilginogluHakEdisPage, { routeName: 'service-bilginoglu-hakedis-open', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/completed',
    Component: withRoute(BilginogluHakEdisPage, { routeName: 'service-bilginoglu-hakedis-completed', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/pending-transfers',
    Component: withRoute(BilginogluHakEdisPendingTransfersPage, { routeName: 'service-bilginoglu-hakedis-pending-transfers', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/pending-shipments',
    Component: withRoute(BilginogluHakEdisPendingShipmentsPage, { routeName: 'service-bilginoglu-hakedis-pending-shipments', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/order-summary-report',
    Component: withRoute(BilginogluHakEdisOrderSummaryReportPage, { routeName: 'service-bilginoglu-hakedis-order-summary-report', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/location-settings',
    Component: withRoute(BilginogluHakEdisLocationSettingsPage, { routeName: 'service-bilginoglu-hakedis-location-settings', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis/operation-settings',
    Component: withRoute(BilginogluHakEdisOperationSettingsPage, { routeName: 'service-bilginoglu-hakedis-operation-settings', namespaces: ['bilginoglu-hakedis', 'common'] }),
  },
  {
    path: 'service-allocation/bilginoglu-hakedis',
    element: <Navigate to="/service-allocation/bilginoglu-hakedis/open" replace />,
  },
  {
    path: 'production/create',
    Component: withRoute(ProductionCreatePage, { routeName: 'production-create', namespaces: ['common'] }),
  },
  {
    path: 'production/detail/:id',
    Component: withRoute(ProductionDetailPage, { routeName: 'production-detail', namespaces: ['common'] }),
  },
  {
    path: 'production/process/:id',
    Component: withRoute(ProductionProcessPage, { routeName: 'production-process', namespaces: ['common'] }),
  },
  {
    path: 'production/list',
    Component: withRoute(ProductionListPage, { routeName: 'production-list', namespaces: ['common'] }),
  },
  {
    path: 'production/assigned',
    Component: withRoute(AssignedProductionListPage, { routeName: 'production-assigned', namespaces: ['common'] }),
  },
  {
    path: 'production/approval',
    Component: withRoute(ProductionApprovalPage, { routeName: 'production-approval', namespaces: ['common'] }),
  },
  {
    path: 'production-transfer/create',
    Component: withRoute(ProductionTransferCreatePage, { routeName: 'production-transfer-create', namespaces: ['common'] }),
  },
  {
    path: 'production-transfer/edit/:id',
    Component: withRoute(ProductionTransferCreatePage, { routeName: 'production-transfer-edit', namespaces: ['common'] }),
  },
  {
    path: 'production-transfer/detail/:id',
    Component: withRoute(ProductionTransferDetailPage, { routeName: 'production-transfer-detail', namespaces: ['common'] }),
  },
  {
    path: 'production-transfer/list',
    Component: withRoute(ProductionTransferListPage, { routeName: 'production-transfer-list', namespaces: ['common'] }),
  },
  {
    path: 'production-transfer/approval',
    Component: withRoute(ProductionTransferApprovalPage, { routeName: 'production-transfer-approval', namespaces: ['common'] }),
  },
  {
    path: 'inventory-count',
    children: [
      { path: 'create', Component: withRoute(InventoryCountCreatePage, { routeName: 'inventory-count-create' }) },
      { path: 'edit/:id', Component: withRoute(InventoryCountCreatePage, { routeName: 'inventory-count-edit' }) },
      { path: 'process', Component: withRoute(InventoryCountProcessPage, { routeName: 'inventory-count-process' }) },
      { path: 'list', Component: withRoute(InventoryCountListPage, { routeName: 'inventory-count-list' }) },
      { path: 'assigned', Component: withRoute(AssignedInventoryCountListPage, { routeName: 'inventory-count-assigned' }) },
    ],
  },
  {
    path: 'inventory',
    children: [
      { path: '3d-warehouse', Component: withRoute(Warehouse3dPage, { routeName: 'warehouse-3d' }) },
      { path: '3d-outside-warehouse', Component: withRoute(OutsideWarehousePage, { routeName: 'warehouse-3d-outside' }) },
    ],
  },
  {
    path: 'package',
    children: [
      { path: 'list', Component: withRoute(PackageListPage, { routeName: 'package-list', namespaces: ['package', 'common'] }) },
      { path: 'create/:headerId?', Component: withRoute(PackageCreatePage, { routeName: 'package-create', namespaces: ['package', 'common'] }) },
      { path: 'edit/:id', Component: withRoute(PackageEditPage, { routeName: 'package-edit', namespaces: ['package', 'common'] }) },
      { path: 'detail/:id', Component: withRoute(PackageDetailPage, { routeName: 'package-detail', namespaces: ['package', 'common'] }) },
      { path: 'package-detail/:id', Component: withRoute(PackagePackageDetailPage, { routeName: 'package-package-detail', namespaces: ['package', 'common'] }) },
      { path: 'settings', Component: withRoute(PackagingSettingsPage, { routeName: 'package-settings', namespaces: ['package', 'common'] }) },
      { path: 'station', Component: withRoute(PackagePackingStationPage, { routeName: 'package-station', namespaces: ['package', 'common'] }) },
    ],
  },
];
