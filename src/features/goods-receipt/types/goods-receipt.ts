import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type { TFunction } from 'i18next';
import type { ErpCustomer, ErpProject, ErpWarehouse, ErpProduct } from '@/services/erp-types';

export const createGoodsReceiptFormSchema = (t: TFunction) => z.object({
  receiptDate: z.string().min(1, t('goodsReceipt.validation.receiptDateRequired', 'Tarih zorunludur')),
  documentNo: z.string().min(1, t('goodsReceipt.validation.documentNoRequired', 'Belge No zorunludur')),
  projectCode: z.string().optional(),
  isInvoice: z.boolean(),
  customerId: z.string().min(1, t('goodsReceipt.validation.customerRequired', 'Cari seçimi zorunludur')),
  notes: z.string().optional(),
});

export type GoodsReceiptFormData = z.infer<ReturnType<typeof createGoodsReceiptFormSchema>>;

export type Customer = ErpCustomer;

export type Project = ErpProject;

export type Warehouse = ErpWarehouse;

export type Product = ErpProduct;

export type CustomersResponse = ApiResponse<Customer[]>;
export type ProjectsResponse = ApiResponse<Project[]>;
export type OrdersResponse = ApiResponse<Order[]>;
export type OrderItemsResponse = ApiResponse<OrderItem[]>;

export interface Order {
  mode: string;
  siparisNo: string;
  orderID: number | null;
  customerCode: string;
  customerName: string;
  branchCode: number;
  targetWh: number;
  projectCode: string | null;
  orderDate: string;
  orderedQty: number;
  deliveredQty: number;
  remainingHamax: number;
  plannedQtyAllocated: number;
  remainingForImport: number;
}

export interface OrderItem {
  id?: string;
  mode: string;
  siparisNo: string;
  orderID: number;
  stockCode: string;
  stockName: string;
  customerCode: string;
  customerName: string;
  branchCode: number;
  targetWh: number;
  projectCode: string;
  orderDate: string;
  orderedQty: number;
  deliveredQty: number;
  remainingHamax: number;
  plannedQtyAllocated: number;
  remainingForImport: number;
  productCode?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface SelectedOrderItem extends OrderItem {
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export interface SelectedStockItem {
  id: string;
  stockCode: string;
  stockName: string;
  unit: string;
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export interface GoodsReceiptItem {
  orderItemId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface GrHeader {
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
  yearCode: string;
  branchCode: string;
  projectCode: string;
  orderId: string;
  plannedDate: string;
  isPlanned: boolean;
  documentType: string;
  description1: string | null;
  description2: string | null;
  priorityLevel: number;
  completionDate: string | null;
  isCompleted: boolean;
  isPendingApproval: boolean;
  approvalStatus: boolean | null;
  approvedByUserId: number | null;
  approvalDate: string | null;
  isERPIntegrated: boolean;
  erpReferenceNumber: string | null;
  erpIntegrationDate: string | null;
  erpIntegrationStatus: string | null;
  erpErrorMessage: string | null;
  customerCode: string;
  returnCode: boolean;
  ocrSource: boolean;
  description3: string | null;
  description4: string | null;
  description5: string | null;
}

export interface GrLine {
  headerId: number;
  orderId: number | null;
  stockCode: string;
  yapKod: string | null;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
}

export interface GrImportRoute {
  importLineId: number;
  lineId: number | null;
  stockCode: string | null;
  stockName: string | null;
  routeCode: string | null;
  description: string;
  scannedBarcode: string;
  quantity: number;
  serialNo: string | null;
  serialNo2: string | null;
  serialNo3: string | null;
  serialNo4: string | null;
  sourceWarehouse: number | null;
  targetWarehouse: number | null;
  sourceCellCode: string | null;
  targetCellCode: string | null;
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string | null;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
}

export interface GrImportLine {
  routes: GrImportRoute[];
  lineId: number;
  headerId: number;
  stockCode: string;
  yapKod: string | null;
  description1: string | null;
  description2: string | null;
  description: string | null;
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string | null;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
}

export interface BulkCreateRequest {
  header: {
    branchCode: string;
    projectCode?: string;
    orderId?: string;
    documentType: string;
    yearCode: string;
    description1?: string;
    description2?: string;
    priorityLevel?: number;
    plannedDate: string;
    isPlanned: boolean;
    customerCode: string;
    returnCode: boolean;
    ocrSource: boolean;
    description3?: string;
    description4?: string;
    description5?: string;
  };
  documents?: Array<{ base64: string }> | null;
  lines?: Array<{
    clientKey: string;
    stockCode: string;
    quantity: number;
    unit?: string;
    erpOrderNo?: string;
    erpOrderId?: string;
    description?: string;
  }>;
  importLines?: Array<{
    lineClientKey: string | null;
    clientKey: string;
    stockCode: string;
    configurationCode?: string;
    description1?: string;
    description2?: string;
  }>;
  serialLines?: Array<{
    importLineClientKey: string;
    serialNo: string;
    quantity: number;
    sourceCellCode?: string;
    targetCellCode?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
  }>;
  routes?: Array<{
    importLineClientKey: string;
    scannedBarcode: string;
    quantity: number;
    description?: string;
    serialNo?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
    sourceWarehouse?: number;
    targetWarehouse?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
  }>;
}

export type GrHeadersResponse = ApiResponse<GrHeader[]>;

export interface AssignedGrLine {
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
  stockCode: string;
  stockName: string;
  yapKod: string | null;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number | null;
}

export interface AssignedGrOrderLinesData {
  lines: AssignedGrLine[];
}

export type AssignedGrOrderLinesResponse = ApiResponse<AssignedGrOrderLinesData>;

export interface StokBarcodeDto {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  depoKodu: string | null;
  depoAdi: string | null;
  rafKodu: string | null;
  yapilandir: string;
  olcuBr: number;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
  cevrim: number;
  seriBarkodMu: boolean;
  sktVarmi: string | null;
  isemriNo: string | null;
}

export type StokBarcodeResponse = ApiResponse<StokBarcodeDto[]>;

export interface AddBarcodeRequest {
  headerId: number;
  lineId: number;
  barcode: string;
  stockCode: string;
  stockName: string;
  yapKod: string;
  yapAcik: string;
  quantity: number;
  serialNo: string;
  serialNo2: string;
  serialNo3: string;
  serialNo4: string;
  sourceCellCode: string;
  targetCellCode: string;
}

export interface AddBarcodeResponseData {
  id: number;
  createdDate: string;
  updatedDate: string | null;
  deletedDate: string | null;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByFullUser: string | null;
  updatedByFullUser: string | null;
  deletedByFullUser: string | null;
  stockCode: string;
  yapKod: string | null;
  description1: string | null;
  description2: string | null;
  description: string | null;
  headerId: number;
  lineId: number;
}

export type AddBarcodeResponse = ApiResponse<AddBarcodeResponseData>;

export interface CollectedBarcodeItem {
  importLine: GrImportLine;
  routes: GrImportRoute[];
}

export type CollectedBarcodesResponse = ApiResponse<CollectedBarcodeItem[]>;
