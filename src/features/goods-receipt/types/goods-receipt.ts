import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type {
  BaseDocumentHeaderDto,
  BaseDocumentLineDto,
  BaseDocumentLineRequest,
  BaseSelectedStockItem,
  BaseWorkflowOrder,
  BaseWorkflowOrderItem,
} from '@/types/document-models';
import type {
  BaseWorkflowImportLineDetail,
  BaseWorkflowRouteDetail,
} from '@/types/detail-models';
import type { TFunction } from 'i18next';
import type { CustomerLookup, ProjectLookup, StockLookup, WarehouseLookup } from '@/services/lookup-types';

const normalizeDocumentNo = (value: string) => value.replace(/\D/g, '');

export const createGoodsReceiptFormSchema = (t: TFunction) => z.object({
  receiptDate: z.string().min(1, t('goodsReceipt.validation.receiptDateRequired')),
  documentNo: z.string().min(1, t('goodsReceipt.validation.documentNoRequired')),
  projectCode: z.string().optional(),
  isInvoice: z.boolean(),
  customerId: z.string().min(1, t('goodsReceipt.validation.customerRequired')),
  notes: z.string().optional(),
  customerRefId: z.number().optional(),
}).superRefine((data, ctx) => {
  const documentNo = normalizeDocumentNo(data.documentNo);

  if (documentNo.length === 0) {
    return;
  }

  const expectedLength = data.isInvoice ? 16 : 15;

  if (documentNo.length !== expectedLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['documentNo'],
      message: data.isInvoice
        ? t('goodsReceipt.validation.documentNoInvoiceLength')
        : t('goodsReceipt.validation.documentNoLength'),
    });
  }
});

export type GoodsReceiptFormData = z.infer<ReturnType<typeof createGoodsReceiptFormSchema>>;

export type Customer = CustomerLookup;

export type Project = ProjectLookup;

export type Warehouse = WarehouseLookup;

export type Product = StockLookup;

export type CustomersResponse = ApiResponse<Customer[]>;
export type ProjectsResponse = ApiResponse<Project[]>;
export type OrdersResponse = ApiResponse<Order[]>;
export type OrderItemsResponse = ApiResponse<OrderItem[]>;

export interface Order extends BaseWorkflowOrder {}

export interface OrderItem extends BaseWorkflowOrderItem {
  productCode?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface SelectedOrderItem extends OrderItem {
  stockId?: number;
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export interface SelectedStockItem extends BaseSelectedStockItem {
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

export interface GrHeader extends Omit<
  BaseDocumentHeaderDto,
  'description1' | 'description2' | 'approvalStatus' | 'approvedByUserId' | 'approvalDate' | 'erpReferenceNumber' | 'erpIntegrationDate' | 'erpIntegrationStatus' | 'erpErrorMessage'
> {
  orderId: string;
  plannedDate: string;
  isPlanned: boolean;
  description1: string | null;
  description2: string | null;
  priorityLevel: number;
  approvalStatus: boolean | null;
  approvedByUserId: number | null;
  approvalDate: string | null;
  erpReferenceNumber: string | null;
  erpIntegrationDate: string | null;
  erpIntegrationStatus: string | null;
  erpErrorMessage: string | null;
  returnCode: boolean;
  ocrSource: boolean;
  description3: string | null;
  description4: string | null;
  description5: string | null;
}

export interface GrLine extends Omit<BaseDocumentLineDto, 'orderId'> {
  orderId: number | null;
  yapKod: string | null;
}

export interface GrImportRoute extends BaseWorkflowRouteDetail {
  importLineId: number;
  lineId: number | null;
  routeCode: string | null;
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

export interface GrImportLine extends BaseWorkflowImportLineDetail {
  routes: GrImportRoute[];
  lineId: number;
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
    customerId?: number;
    customerCode: string;
    returnCode: boolean;
    ocrSource: boolean;
    description3?: string;
    description4?: string;
    description5?: string;
  };
  documents?: Array<{ base64: string }> | null;
  lines?: Array<BaseDocumentLineRequest>;
  importLines?: Array<{
    lineClientKey: string | null;
    clientKey: string;
    stockId?: number;
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
