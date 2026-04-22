import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const CustomerReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'CustomerReferencePage');
const StockReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'StockReferencePage');
const WarehouseReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'WarehouseReferencePage');
const ShelfManagementPage = lazyNamed(() => import('@/features/shelf-management'), 'ShelfManagementPage');
const YapKodReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'YapKodReferencePage');
const BarcodeDefinitionsPage = lazyNamed(() => import('@/features/barcode-definitions'), 'BarcodeDefinitionsPage');

const BarcodeDesignerFormPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodeDesignerFormPage');
const BarcodeDesignerListPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodeDesignerListPage');
const BarcodePrintPage = lazyNamed(() => import('@/features/barcode-designer'), 'BarcodePrintPage');
const PrinterManagementPage = lazyNamed(() => import('@/features/printer-management'), 'PrinterManagementPage');

export const erpChildRoutes: RouteObject[] = [
  {
    path: 'erp',
    children: [
      { path: 'customers', element: withRoute(CustomerReferencePage, { routeName: 'erp-customers' }) },
      { path: 'stocks', element: withRoute(StockReferencePage, { routeName: 'erp-stocks' }) },
      { path: 'warehouses', element: withRoute(WarehouseReferencePage, { routeName: 'erp-warehouses' }) },
      { path: 'shelves', element: withRoute(ShelfManagementPage, { routeName: 'erp-shelves' }) },
      { path: 'yapkodlar', element: withRoute(YapKodReferencePage, { routeName: 'erp-yapkodlar' }) },
      { path: 'barcodes', element: withRoute(BarcodeDefinitionsPage, { routeName: 'erp-barcode-definitions' }) },
      { path: 'barcode-designer', element: withRoute(BarcodeDesignerListPage, { routeName: 'erp-barcode-designer-list' }) },
      { path: 'barcode-designer/new', element: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-create' }) },
      { path: 'barcode-designer/:id/edit', element: withRoute(BarcodeDesignerFormPage, { routeName: 'erp-barcode-designer-edit' }) },
      { path: 'barcode-designer/:id/print', element: withRoute(BarcodePrintPage, { routeName: 'erp-barcode-designer-print' }) },
      { path: 'printer-management', element: withRoute(PrinterManagementPage, { routeName: 'erp-printer-management' }) },
    ],
  },
];
