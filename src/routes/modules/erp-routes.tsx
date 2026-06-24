import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const CustomerReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'CustomerReferencePage');
const StockReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'StockReferencePage');
const WarehouseReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'WarehouseReferencePage');
const ShelfManagementPage = lazyNamed(() => import('@/features/shelf-management'), 'ShelfManagementPage');
const WarehouseStockBalancePage = lazyNamed(() => import('@/features/warehouse-balance'), 'WarehouseStockBalancePage');
const WarehouseStockSerialBalancePage = lazyNamed(() => import('@/features/warehouse-balance'), 'WarehouseStockSerialBalancePage');
const YapKodReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'YapKodReferencePage');
const BarcodeDefinitionsPage = lazyNamed(() => import('@/features/barcode-definitions'), 'BarcodeDefinitionsPage');

const BarcodeDesignerFormPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodeDesignerFormPage');
const BarcodeDesignerListPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodeDesignerListPage');
const BarcodePrintPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodePrintPage');
const PrinterManagementPage = lazyNamed(() => import('@/features/printer-management'), 'PrinterManagementPage');
const KkdEmployeePage = lazyNamed(() => import('@/features/kkd'), 'KkdEmployeePage');
const KkdEmployeeDepartmentPage = lazyNamed(() => import('@/features/kkd'), 'KkdEmployeeDepartmentPage');
const KkdEmployeeRolePage = lazyNamed(() => import('@/features/kkd'), 'KkdEmployeeRolePage');
const KkdEntitlementMatrixPage = lazyNamed(() => import('@/features/kkd'), 'KkdEntitlementMatrixPage');
const KkdEntitlementOverridePage = lazyNamed(() => import('@/features/kkd'), 'KkdEntitlementOverridePage');
const DocumentSeriesDefinitionManagementPage = lazyNamed(() => import('@/features/document-series-management'), 'DocumentSeriesDefinitionManagementPage');
const DocumentSeriesRuleManagementPage = lazyNamed(() => import('@/features/document-series-management'), 'DocumentSeriesRuleManagementPage');

export const erpChildRoutes: RouteObject[] = [
  {
    path: 'erp',
    children: [
      { path: 'customers', Component: withRoute(CustomerReferencePage, { routeName: 'erp-customers' }) },
      { path: 'stocks', Component: withRoute(StockReferencePage, { routeName: 'erp-stocks' }) },
      { path: 'warehouses', Component: withRoute(WarehouseReferencePage, { routeName: 'erp-warehouses' }) },
      { path: 'shelves', Component: withRoute(ShelfManagementPage, { routeName: 'erp-shelves' }) },
      { path: 'warehouse-stock-balance', Component: withRoute(WarehouseStockBalancePage, { routeName: 'erp-warehouse-stock-balance' }) },
      { path: 'warehouse-serial-balance', Component: withRoute(WarehouseStockSerialBalancePage, { routeName: 'erp-warehouse-serial-balance' }) },
      { path: 'yapkodlar', Component: withRoute(YapKodReferencePage, { routeName: 'erp-yapkodlar' }) },
      { path: 'barcodes', Component: withRoute(BarcodeDefinitionsPage, { routeName: 'erp-barcode-definitions' }) },
      { path: 'barcode-designer', Component: withRoute(BarcodeDesignerListPage, { routeName: 'erp-barcode-designer-list' }) },
      { path: 'barcode-designer/new', Component: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-create' }) },
      { path: 'barcode-designer/:id/edit', Component: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-edit' }) },
      { path: 'barcode-designer/:id/print', Component: withRoute(BarcodePrintPage, { routeName: 'erp-barcode-designer-print' }) },
      { path: 'printer-management', Component: withRoute(PrinterManagementPage, { routeName: 'erp-printer-management' }) },
      { path: 'kkd/employees', Component: withRoute(KkdEmployeePage, { routeName: 'erp-kkd-employees' }) },
      { path: 'kkd/departments', Component: withRoute(KkdEmployeeDepartmentPage, { routeName: 'erp-kkd-departments' }) },
      { path: 'kkd/roles', Component: withRoute(KkdEmployeeRolePage, { routeName: 'erp-kkd-roles' }) },
      { path: 'kkd/entitlement-matrix', Component: withRoute(KkdEntitlementMatrixPage, { routeName: 'erp-kkd-entitlement-matrix' }) },
      { path: 'kkd/manual-overrides', Component: withRoute(KkdEntitlementOverridePage, { routeName: 'erp-kkd-manual-overrides' }) },
      { path: 'document-series/definitions', Component: withRoute(DocumentSeriesDefinitionManagementPage, { routeName: 'erp-document-series-definitions' }) },
      { path: 'document-series/rules', Component: withRoute(DocumentSeriesRuleManagementPage, { routeName: 'erp-document-series-rules' }) },
    ],
  },
];
