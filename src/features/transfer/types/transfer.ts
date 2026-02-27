import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type { TFunction } from 'i18next';

export const createTransferFormSchema = (t: TFunction, isFreeTransfer: boolean = false) => z.object({
  transferDate: z.string().min(1, t('transfer.validation.transferDateRequired', 'Tarih zorunludur')),
  documentNo: z.string().min(1, t('transfer.validation.documentNoRequired', 'Belge No zorunludur')),
  projectCode: z.string().optional(),
  customerId: isFreeTransfer ? z.string().optional() : z.string().min(1, t('transfer.validation.customerRequired', 'Cari seçimi zorunludur')),
  sourceWarehouse: isFreeTransfer 
    ? z.string().min(1, t('transfer.validation.sourceWarehouseRequired', 'Çıkış deposu zorunludur'))
    : z.string().optional(),
  targetWarehouse: z.string().min(1, t('transfer.validation.targetWarehouseRequired', 'Varış deposu zorunludur')),
  notes: z.string().optional(),
  userIds: z.array(z.string()).optional(),
});

export type TransferFormData = z.infer<ReturnType<typeof createTransferFormSchema>>;

export interface TransferOrder {
  mode: string;
  siparisNo: string;
  orderID: number;
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

export interface TransferOrderItem {
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
  unit?: string;
}

export interface SelectedTransferOrderItem extends TransferOrderItem {
  transferQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  serialNo2?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  sourceWarehouse?: number;
  sourceCellCode?: string;
  targetCellCode?: string;
}

export interface SelectedTransferStockItem {
  id: string;
  stockCode: string;
  stockName: string;
  unit: string;
  transferQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  serialNo2?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  sourceWarehouse?: number;
  sourceCellCode?: string;
  targetCellCode?: string;
}

export interface TransferGenerateRequest {
  header: {
    branchCode: string;
    projectCode: string;
    orderId: string;
    documentType: string;
    yearCode: string;
    description1: string;
    description2: string;
    priorityLevel: number;
    plannedDate: string;
    isPlanned: boolean;
    isCompleted: boolean;
    completedDate: string;
    documentNo: string;
    documentDate: string;
    customerCode: string;
    customerName: string;
    sourceWarehouse: string;
    targetWarehouse: string;
    priority: string;
    type: number;
  };
  lines: {
    clientKey: string;
    clientGuid: string;
    stockCode: string;
    yapKod: string;
    orderId: number;
    quantity: number;
    unit: string;
    erpOrderNo: string;
    erpOrderId: string;
    erpLineReference: string;
    description: string;
  }[];
  lineSerials: {
    quantity: number;
    serialNo: string;
    serialNo2: string;
    serialNo3: string;
    serialNo4: string;
    sourceCellCode: string;
    targetCellCode: string;
    lineClientKey: string;
    lineGroupGuid: string;
  }[];
  terminalLines: {
    terminalUserId: number;
  }[];
  userIds?: number[];
}

export type TransferOrdersResponse = ApiResponse<TransferOrder[]>;
export type TransferOrderItemsResponse = ApiResponse<TransferOrderItem[]>;

export interface TransferHeader {
  id: number;
  branchCode: string;
  projectCode: string;
  documentNo: string;
  documentDate: string;
  documentType: string;
  customerCode: string;
  customerName: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  priority: string;
  yearCode: string;
  description1: string;
  description2: string;
  priorityLevel: number;
  type: number;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
  deletedBy: string;
  deletedDate: string;
  completionDate: string;
  isCompleted: boolean;
  isPendingApproval: boolean;
  approvalStatus: boolean;
  approvedByUserId: number;
  approvalDate: string;
  isERPIntegrated: boolean;
  erpReferenceNumber: string;
  erpIntegrationDate: string;
  erpIntegrationStatus: string;
  erpErrorMessage: string;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
}

export interface TransferLine {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  stockCode: string;
  yapKod: string;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number;
  erpLineReference: string;
}

export interface TransferLineSerial {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  quantity: number;
  serialNo: string;
  serialNo2: string;
  serialNo3: string;
  serialNo4: string;
  sourceCellCode: string;
  targetCellCode: string;
  lineId: number;
}

export type TransferHeadersResponse = ApiResponse<TransferHeader[]>;
export type TransferLinesResponse = ApiResponse<TransferLine[]>;
export type TransferLineSerialsResponse = ApiResponse<TransferLineSerial[]>;

export interface AssignedTransferLine {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  stockCode: string;
  stockName: string;
  yapKod: string;
  yapAcik: string;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number;
  erpLineReference: string;
}

export interface AssignedTransferLineSerial {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  quantity: number;
  serialNo: string;
  serialNo2: string;
  serialNo3: string;
  serialNo4: string;
  sourceCellCode: string;
  targetCellCode: string;
  lineId: number;
}

export interface AssignedTransferImportLine {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  stockCode: string;
  stockName: string;
  yapKod: string;
  yapAcik: string;
  description1: string;
  description2: string;
  description: string;
  headerId: number;
  lineId: number;
  routeId: number;
}

export interface AssignedTransferRoute {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  scannedBarcode: string;
  quantity: number;
  serialNo: string;
  serialNo2: string;
  serialNo3: string;
  serialNo4: string;
  sourceWarehouse: number;
  targetWarehouse: number;
  sourceCellCode: string;
  targetCellCode: string;
  importLineId: number;
  stockCode: string;
  yapKod: string;
  description: string;
  packageLineId: number | null;
  packageNo: string | null;
  packageHeaderId: number | null;
}

export interface AssignedTransferOrderLinesData {
  lines: AssignedTransferLine[];
  lineSerials: AssignedTransferLineSerial[];
  importLines: AssignedTransferImportLine[];
  routes: AssignedTransferRoute[];
}

export type AssignedTransferOrderLinesResponse = ApiResponse<AssignedTransferOrderLinesData>;

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
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  stockCode: string;
  stockName: string;
  yapKod: string;
  yapAcik: string;
  description1: string;
  description2: string;
  description: string;
  headerId: number;
  lineId: number;
  routeId: number;
}

export type AddBarcodeResponse = ApiResponse<AddBarcodeResponseData>;

export interface CollectedBarcodeItem {
  importLine: AssignedTransferImportLine;
  routes: AssignedTransferRoute[];
}

export type CollectedBarcodesResponse = ApiResponse<CollectedBarcodeItem[]>;

export interface AwaitingApprovalHeader {
  id: number;
  createdDate: string;
  updatedDate: string;
  deletedDate: string;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  createdByFullUser: string;
  updatedByFullUser: string;
  deletedByFullUser: string;
  yearCode: string;
  branchCode: string;
  projectCode: string;
  orderId: string;
  plannedDate: string;
  isPlanned: boolean;
  documentType: string;
  description1: string;
  description2: string;
  priorityLevel: number;
  completionDate: string;
  isCompleted: boolean;
  isPendingApproval: boolean;
  approvalStatus: boolean;
  approvedByUserId: number;
  approvalDate: string;
  isERPIntegrated: boolean;
  erpReferenceNumber: string;
  erpIntegrationDate: string;
  erpIntegrationStatus: string;
  erpErrorMessage: string;
  documentNo: string;
  documentDate: string;
  customerCode: string;
  customerName: string;
  sourceWarehouse: string;
  sourceWarehouseName: string;
  targetWarehouse: string;
  targetWarehouseName: string;
  priority: string;
  type: number;
}


