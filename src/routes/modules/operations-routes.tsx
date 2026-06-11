import type { RouteObject } from 'react-router-dom';
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
  { path: 'vehicle-check-in', element: withRoute(VehicleCheckInPage, { routeName: 'vehicle-check-in' }) },
  { path: 'vehicle-check-in/list', element: withRoute(VehicleCheckInListPage, { routeName: 'vehicle-check-in-list' }) },
  { path: 'ocr-goods-receipt-match', element: withRoute(OcrGoodsReceiptMatchPage, { routeName: 'ocr-goods-receipt-match' }) },
  { path: 'ocr-goods-receipt-match/list', element: withRoute(OcrGoodsReceiptMatchListPage, { routeName: 'ocr-goods-receipt-match-list' }) },
  { path: 'quality-control/rules', element: withRoute(QualityControlRulePage, { routeName: 'quality-control-rules' }) },
  { path: 'quality-control/rules/list', element: withRoute(QualityControlRuleListPage, { routeName: 'quality-control-rules-list' }) },
  { path: 'quality-control/settings', element: withRoute(QualityControlSettingsPage, { routeName: 'quality-control-settings' }) },
  { path: 'quality-control/inspections', element: withRoute(QualityControlInspectionPage, { routeName: 'quality-control-inspections' }) },
  { path: 'quality-control/inspections/list', element: withRoute(QualityControlInspectionListPage, { routeName: 'quality-control-inspections-list' }) },
  { path: 'quality-control/quarantine', element: withRoute(QualityControlQuarantineQueuePage, { routeName: 'quality-control-quarantine' }) },
  {
    path: 'sac-mal-kabul',
    children: [
      { path: 'import', element: withRoute(SteelGoodReciptAcceptanseImportPage, { routeName: 'sgra-import' }) },
      { path: 'list', element: withRoute(SteelGoodReciptAcceptanseListPage, { routeName: 'sgra-list' }) },
      { path: 'inspection', element: withRoute(SteelGoodReciptAcceptanseInspectionPage, { routeName: 'sgra-inspection' }) },
      { path: 'receipt', element: withRoute(SteelGoodReciptAcceptanseReceiptPage, { routeName: 'sgra-receipt' }) },
      { path: 'placement', element: withRoute(SteelGoodReciptAcceptansePlacementPage, { routeName: 'sgra-placement' }) },
    ],
  },
  {
    path: 'kkd',
    children: [
      { index: true, element: withRoute(KkdOverviewPage, { routeName: 'kkd-overview', namespaces: ['kkd', 'common'] }) },
      { path: 'initial-order', element: withRoute(KkdInitialOrderPage, { routeName: 'kkd-initial-order', namespaces: ['kkd', 'common'] }) },
      { path: 'distribution', element: withRoute(KkdDistributionPage, { routeName: 'kkd-distribution', namespaces: ['kkd', 'common'] }) },
      { path: 'distribution-list', element: withRoute(KkdDistributionListPage, { routeName: 'kkd-distribution-list', namespaces: ['kkd', 'common'] }) },
      { path: 'remaining-entitlements', element: withRoute(KkdRemainingEntitlementsPage, { routeName: 'kkd-remaining-entitlements', namespaces: ['kkd', 'common'] }) },
      { path: 'entitlement-check', element: withRoute(KkdEntitlementCheckPage, { routeName: 'kkd-entitlement-check', namespaces: ['kkd', 'common'] }) },
      { path: 'validation-logs', element: withRoute(KkdValidationLogPage, { routeName: 'kkd-validation-logs', namespaces: ['kkd', 'common'] }) },
      { path: 'reports/departments', element: withRoute(KkdDepartmentReportPage, { routeName: 'kkd-department-report', namespaces: ['kkd', 'common'] }) },
      { path: 'reports/roles', element: withRoute(KkdRoleReportPage, { routeName: 'kkd-role-report', namespaces: ['kkd', 'common'] }) },
      { path: 'reports/groups', element: withRoute(KkdGroupReportPage, { routeName: 'kkd-group-report', namespaces: ['kkd', 'common'] }) },
    ],
  },
  {
    path: 'goods-receipt',
    children: [
      { path: 'create', element: withRoute(GoodsReceiptCreatePage, { routeName: 'goods-receipt-create', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'edit/:id', element: withRoute(GoodsReceiptEditPage, { routeName: 'goods-receipt-edit', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'process', element: withRoute(GoodsReceiptProcessPage, { routeName: 'goods-receipt-process', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'list', element: withRoute(GoodsReceiptListPage, { routeName: 'goods-receipt-list', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'assigned', element: withRoute(AssignedGrListPage, { routeName: 'goods-receipt-assigned', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'approval', element: withRoute(GoodsReceiptApprovalPage, { routeName: 'goods-receipt-approval', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'pre-labels', element: withRoute(GoodsReceiptPreReceiptLabelsPage, { routeName: 'goods-receipt-pre-labels', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'pre-label-receiving', element: withRoute(GoodsReceiptPreLabelReceivingPage, { routeName: 'goods-receipt-pre-label-receiving', namespaces: ['goods-receipt', 'common'] }) },
      { path: 'collection/:headerId', element: withRoute(GoodsReceiptCollectionPage, { routeName: 'goods-receipt-collection', namespaces: ['goods-receipt', 'common'] }) },
    ],
  },
  {
    path: 'transfer',
    children: [
      { path: 'create', element: withRoute(TransferCreatePage, { routeName: 'transfer-create', namespaces: ['transfer', 'common'] }) },
      { path: 'edit/:id', element: withRoute(TransferEditPage, { routeName: 'transfer-edit', namespaces: ['transfer', 'common'] }) },
      { path: 'process', element: withRoute(TransferProcessPage, { routeName: 'transfer-process', namespaces: ['transfer', 'common'] }) },
      { path: 'list', element: withRoute(TransferListPage, { routeName: 'transfer-list', namespaces: ['transfer', 'common'] }) },
      { path: 'assigned', element: withRoute(AssignedTransferListPage, { routeName: 'transfer-assigned', namespaces: ['transfer', 'common'] }) },
      { path: 'collection/:headerId', element: withRoute(TransferCollectionPage, { routeName: 'transfer-collection', namespaces: ['transfer', 'transfer-chain', 'common'] }) },
      { path: 'collected/:headerId', element: withRoute(CollectedBarcodesPage, { routeName: 'transfer-collected-barcodes', namespaces: ['transfer', 'common'] }) },
      { path: 'approval', element: withRoute(TransferApprovalPage, { routeName: 'transfer-approval', namespaces: ['transfer', 'common'] }) },
      { path: 'chains', element: withRoute(TransferChainListPage, { routeName: 'transfer-chain-list', namespaces: ['transfer-chain', 'common'] }) },
      { path: 'bilginoglu-hakedis', element: withRoute(BilginogluHakEdisPage, { routeName: 'bilginoglu-hakedis', namespaces: ['bilginoglu-hakedis', 'common'] }) },
    ],
  },
  {
    path: 'subcontracting',
    children: [
      {
        path: 'issue',
        children: [
          { path: 'create', element: withRoute(SubcontractingIssueCreatePage, { routeName: 'subcontracting-issue-create' }) },
          { path: 'edit/:id', element: withRoute(SubcontractingIssueEditPage, { routeName: 'subcontracting-issue-edit' }) },
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
          { path: 'edit/:id', element: withRoute(SubcontractingReceiptEditPage, { routeName: 'subcontracting-receipt-edit' }) },
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
          { path: 'create', element: withRoute(WarehouseInboundCreatePage, { routeName: 'warehouse-inbound-create', namespaces: ['warehouse', 'common'] }) },
          { path: 'edit/:id', element: withRoute(WarehouseInboundEditPage, { routeName: 'warehouse-inbound-edit', namespaces: ['warehouse', 'common'] }) },
          { path: 'process', element: withRoute(WarehouseInboundProcessPage, { routeName: 'warehouse-inbound-process', namespaces: ['warehouse', 'common'] }) },
          { path: 'list', element: withRoute(WarehouseInboundListPage, { routeName: 'warehouse-inbound-list', namespaces: ['warehouse', 'common'] }) },
          { path: 'assigned', element: withRoute(AssignedWarehouseInboundListPage, { routeName: 'warehouse-inbound-assigned', namespaces: ['warehouse', 'common'] }) },
          { path: 'approval', element: withRoute(WarehouseInboundApprovalPage, { routeName: 'warehouse-inbound-approval', namespaces: ['warehouse', 'common'] }) },
        ],
      },
      {
        path: 'outbound',
        children: [
          { path: 'create', element: withRoute(WarehouseOutboundCreatePage, { routeName: 'warehouse-outbound-create', namespaces: ['warehouse', 'common'] }) },
          { path: 'edit/:id', element: withRoute(WarehouseOutboundEditPage, { routeName: 'warehouse-outbound-edit', namespaces: ['warehouse', 'common'] }) },
          { path: 'process', element: withRoute(WarehouseOutboundProcessPage, { routeName: 'warehouse-outbound-process', namespaces: ['warehouse', 'common'] }) },
          { path: 'list', element: withRoute(WarehouseOutboundListPage, { routeName: 'warehouse-outbound-list', namespaces: ['warehouse', 'common'] }) },
          { path: 'assigned', element: withRoute(AssignedWarehouseOutboundListPage, { routeName: 'warehouse-outbound-assigned', namespaces: ['warehouse', 'common'] }) },
          { path: 'approval', element: withRoute(WarehouseOutboundApprovalPage, { routeName: 'warehouse-outbound-approval', namespaces: ['warehouse', 'common'] }) },
        ],
      },
    ],
  },
  {
    path: 'shipment',
    children: [
      { path: 'create', element: withRoute(ShipmentCreatePage, { routeName: 'shipment-create', namespaces: ['shipment', 'common'] }) },
      { path: 'edit/:id', element: withRoute(ShipmentEditPage, { routeName: 'shipment-edit', namespaces: ['shipment', 'common'] }) },
      { path: 'process', element: withRoute(ShipmentProcessPage, { routeName: 'shipment-process', namespaces: ['shipment', 'common'] }) },
      { path: 'list', element: withRoute(ShipmentListPage, { routeName: 'shipment-list', namespaces: ['shipment', 'common'] }) },
      { path: 'assigned', element: withRoute(AssignedShipmentListPage, { routeName: 'shipment-assigned', namespaces: ['shipment', 'common'] }) },
      { path: 'collection/:headerId', element: withRoute(ShipmentCollectionPage, { routeName: 'shipment-collection', namespaces: ['shipment', 'transfer-chain', 'common'] }) },
      { path: 'loading', element: withRoute(ShipmentLoadingPage, { routeName: 'shipment-loading', namespaces: ['shipment-loading', 'common'] }) },
      { path: 'approval', element: withRoute(ShipmentApprovalPage, { routeName: 'shipment-approval', namespaces: ['shipment', 'common'] }) },
    ],
  },
  {
    path: 'service-allocation',
    children: [
      { path: 'allocation-queue', element: withRoute(AllocationQueuePage, { routeName: 'service-allocation-queue', namespaces: ['service-allocation', 'common'] }) },
      { path: 'cases', element: withRoute(ServiceCaseListPage, { routeName: 'service-allocation-cases', namespaces: ['service-allocation', 'common'] }) },
      { path: 'cases/new', element: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-create', namespaces: ['service-allocation', 'common'] }) },
      { path: 'cases/:id', element: withRoute(ServiceCaseTimelinePage, { routeName: 'service-allocation-case-timeline', namespaces: ['service-allocation', 'common'] }) },
      { path: 'cases/:id/edit', element: withRoute(ServiceCaseFormPage, { routeName: 'service-allocation-case-edit', namespaces: ['service-allocation', 'common'] }) },
      { path: 'document-links', element: withRoute(DocumentLinksPage, { routeName: 'service-allocation-document-links', namespaces: ['service-allocation', 'common'] }) },
      { path: 'reports', element: withRoute(ServiceReportsPage, { routeName: 'service-allocation-reports', namespaces: ['service-allocation', 'common'] }) },
      { path: 'bilginoglu-hakedis', element: withRoute(BilginogluHakEdisPage, { routeName: 'service-bilginoglu-hakedis-open', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/open', element: withRoute(BilginogluHakEdisPage, { routeName: 'service-bilginoglu-hakedis-open', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/completed', element: withRoute(BilginogluHakEdisPage, { routeName: 'service-bilginoglu-hakedis-completed', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/pending-transfers', element: withRoute(BilginogluHakEdisPendingTransfersPage, { routeName: 'service-bilginoglu-hakedis-pending-transfers', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/pending-shipments', element: withRoute(BilginogluHakEdisPendingShipmentsPage, { routeName: 'service-bilginoglu-hakedis-pending-shipments', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/location-settings', element: withRoute(BilginogluHakEdisLocationSettingsPage, { routeName: 'service-bilginoglu-hakedis-location-settings', namespaces: ['bilginoglu-hakedis', 'common'] }) },
      { path: 'bilginoglu-hakedis/operation-settings', element: withRoute(BilginogluHakEdisOperationSettingsPage, { routeName: 'service-bilginoglu-hakedis-operation-settings', namespaces: ['bilginoglu-hakedis', 'common'] }) },
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
      { path: 'edit/:id', element: withRoute(ProductionTransferCreatePage, { routeName: 'production-transfer-edit' }) },
      { path: 'detail/:id', element: withRoute(ProductionTransferDetailPage, { routeName: 'production-transfer-detail' }) },
      { path: 'list', element: withRoute(ProductionTransferListPage, { routeName: 'production-transfer-list' }) },
      { path: 'approval', element: withRoute(ProductionTransferApprovalPage, { routeName: 'production-transfer-approval' }) },
    ],
  },
  {
    path: 'inventory-count',
    children: [
      { path: 'create', element: withRoute(InventoryCountCreatePage, { routeName: 'inventory-count-create' }) },
      { path: 'edit/:id', element: withRoute(InventoryCountCreatePage, { routeName: 'inventory-count-edit' }) },
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
      { path: 'list', element: withRoute(PackageListPage, { routeName: 'package-list', namespaces: ['package', 'common'] }) },
      { path: 'create/:headerId?', element: withRoute(PackageCreatePage, { routeName: 'package-create', namespaces: ['package', 'common'] }) },
      { path: 'edit/:id', element: withRoute(PackageEditPage, { routeName: 'package-edit', namespaces: ['package', 'common'] }) },
      { path: 'detail/:id', element: withRoute(PackageDetailPage, { routeName: 'package-detail', namespaces: ['package', 'common'] }) },
      { path: 'package-detail/:id', element: withRoute(PackagePackageDetailPage, { routeName: 'package-package-detail', namespaces: ['package', 'common'] }) },
      { path: 'settings', element: withRoute(PackagingSettingsPage, { routeName: 'package-settings', namespaces: ['package', 'common'] }) },
      { path: 'station', element: withRoute(PackagePackingStationPage, { routeName: 'package-station', namespaces: ['package', 'common'] }) },
    ],
  },
];
