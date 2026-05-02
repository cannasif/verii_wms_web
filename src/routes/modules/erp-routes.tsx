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
      { path: 'customers', element: withRoute(CustomerReferencePage, { routeName: 'erp-customers' }) },
      { path: 'stocks', element: withRoute(StockReferencePage, { routeName: 'erp-stocks' }) },
      { path: 'warehouses', element: withRoute(WarehouseReferencePage, { routeName: 'erp-warehouses' }) },
      { path: 'shelves', element: withRoute(ShelfManagementPage, { routeName: 'erp-shelves' }) },
      { path: 'warehouse-stock-balance', element: withRoute(WarehouseStockBalancePage, { routeName: 'erp-warehouse-stock-balance' }) },
      { path: 'warehouse-serial-balance', element: withRoute(WarehouseStockSerialBalancePage, { routeName: 'erp-warehouse-serial-balance' }) },
      { path: 'yapkodlar', element: withRoute(YapKodReferencePage, { routeName: 'erp-yapkodlar' }) },
      { path: 'barcodes', element: withRoute(BarcodeDefinitionsPage, { routeName: 'erp-barcode-definitions' }) },
      { path: 'barcode-designer', element: withRoute(BarcodeDesignerListPage, { routeName: 'erp-barcode-designer-list' }) },
      { path: 'barcode-designer/new', element: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-create' }) },
      { path: 'barcode-designer/:id/edit', element: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-edit' }) },
      { path: 'barcode-designer/:id/print', element: withRoute(BarcodePrintPage, { routeName: 'erp-barcode-designer-print' }) },
      { path: 'printer-management', element: withRoute(PrinterManagementPage, { routeName: 'erp-printer-management' }) },
      { path: 'kkd/employees', element: withRoute(KkdEmployeePage, { routeName: 'erp-kkd-employees' }) },
      { path: 'kkd/departments', element: withRoute(KkdEmployeeDepartmentPage, { routeName: 'erp-kkd-departments' }) },
      { path: 'kkd/roles', element: withRoute(KkdEmployeeRolePage, { routeName: 'erp-kkd-roles' }) },
      { path: 'kkd/entitlement-matrix', element: withRoute(KkdEntitlementMatrixPage, { routeName: 'erp-kkd-entitlement-matrix' }) },
      { path: 'kkd/manual-overrides', element: withRoute(KkdEntitlementOverridePage, { routeName: 'erp-kkd-manual-overrides' }) },
      { path: 'document-series/definitions', element: withRoute(DocumentSeriesDefinitionManagementPage, { routeName: 'erp-document-series-definitions' }) },
      { path: 'document-series/rules', element: withRoute(DocumentSeriesRuleManagementPage, { routeName: 'erp-document-series-rules' }) },
    ],
  },
];
