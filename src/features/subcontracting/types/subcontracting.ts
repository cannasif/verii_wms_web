import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type {
  BaseDocumentHeaderDto,
  BaseDocumentHeaderRequest,
  BaseDocumentLineDto,
  BaseDocumentLineRequest,
  BaseDocumentLineSerialRequest,
  BaseDocumentLineSerialDto,
  BaseWorkflowOrder,
  BaseWorkflowOrderItem,
} from '@/types/document-models';
import type {
  BaseWorkflowImportLineDetail,
  BaseWorkflowRouteDetail,
} from '@/types/detail-models';
import type { TFunction } from 'i18next';

export const createSubcontractingFormSchema = (t: TFunction) => z.object({
  transferDate: z.string().min(1, t('subcontracting.validation.transferDateRequired')),
  documentNo: z.string().min(1, t('subcontracting.validation.documentNoRequired')),
  projectCode: z.string().optional(),
  customerId: z.string().min(1, t('subcontracting.validation.customerRequired')),
  sourceWarehouse: z.string().min(1, t('subcontracting.validation.sourceWarehouseRequired')),
  targetWarehouse: z.string().min(1, t('subcontracting.validation.targetWarehouseRequired')),
  notes: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  customerRefId: z.number().optional(),
  sourceWarehouseId: z.number().optional(),
  targetWarehouseId: z.number().optional(),
});

export type SubcontractingFormData = z.infer<ReturnType<typeof createSubcontractingFormSchema>>;

export interface SubcontractingOrder extends BaseWorkflowOrder {
  orderID: number;
}

export interface SubcontractingOrderItem extends BaseWorkflowOrderItem {
  yapKod?: string;
  yapAcik?: string;
}

export interface SelectedSubcontractingOrderItem extends SubcontractingOrderItem {
  stockId?: number;
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

export interface SelectedSubcontractingStockItem {
  id: string;
  stockId?: number;
  yapKodId?: number;
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
  sourceCellCode?: string;
  targetCellCode?: string;
}

export interface SubcontractingGenerateRequest {
  header: BaseDocumentHeaderRequest & {
    type: number;
  };
  lines: Array<BaseDocumentLineRequest & {
    stockName?: string;
    yapKod: string;
    yapAcik?: string;
  }>;
  lineSerials: Array<BaseDocumentLineSerialRequest>;
  terminalLines: {
    terminalUserId: number;
  }[];
  userIds?: number[];
}

export interface SubcontractingProcessRequest {
  header: SubcontractingGenerateRequest['header'];
  routes: Array<{
    stockId?: number;
    stockCode: string;
    yapKodId?: number;
    yapKod?: string;
    quantity: number;
    serialNo?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
    scannedBarcode?: string;
    sourceWarehouse?: number;
    targetWarehouse?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
  }>;
}

export type SubcontractingOrdersResponse = ApiResponse<SubcontractingOrder[]>;
export type SubcontractingOrderItemsResponse = ApiResponse<SubcontractingOrderItem[]>;

export interface SubcontractingHeader extends BaseDocumentHeaderDto {
  priorityLevel: number;
  type: number;
}

export interface SubcontractingLine extends BaseDocumentLineDto {
  stockName: string;
  yapKod: string;
  yapAcik: string;
}

export interface SubcontractingLineSerial extends BaseDocumentLineSerialDto {}

export type SubcontractingHeadersResponse = ApiResponse<SubcontractingHeader[]>;
export type SubcontractingLinesResponse = ApiResponse<SubcontractingLine[]>;
export type SubcontractingLineSerialsResponse = ApiResponse<SubcontractingLineSerial[]>;

export interface AssignedSubcontractingLine {
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
  stockCode?: string;
  stockName?: string;
  yapKod?: string;
  yapAcik?: string;
  quantity: number;
  siparisMiktar?: number | null;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number;
  erpLineReference: string;
}

export interface AssignedSubcontractingLineSerial {
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
  sourceWarehouseId?: number | null;
  targetWarehouseId?: number | null;
  sourceCellCode: string;
  targetCellCode: string;
  lineId: number;
}

export interface AssignedSubcontractingImportLine extends BaseWorkflowImportLineDetail {
  lineId: number;
  routeId: number;
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
}

export interface AssignedSubcontractingRoute extends BaseWorkflowRouteDetail {
  importLineId: number;
  yapKod: string;
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
}

export interface AssignedSubcontractingOrderLinesData {
  lines: AssignedSubcontractingLine[];
  lineSerials: AssignedSubcontractingLineSerial[];
  importLines: AssignedSubcontractingImportLine[];
  routes: AssignedSubcontractingRoute[];
}

export type AssignedSubcontractingOrderLinesResponse = ApiResponse<AssignedSubcontractingOrderLinesData>;

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
  barcode: string;
  stockCode?: string;
  stockName?: string;
  yapKod?: string;
  yapAcik?: string;
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
  stockCode?: string;
  stockName?: string;
  yapKod?: string;
  yapAcik?: string;
  description1: string;
  description2: string;
  description: string;
  headerId: number;
  lineId: number;
  routeId: number;
}

export type AddBarcodeResponse = ApiResponse<AddBarcodeResponseData>;

export interface CollectedBarcodeItem {
  importLine: AssignedSubcontractingImportLine;
  routes: AssignedSubcontractingRoute[];
}

export type CollectedBarcodesResponse = ApiResponse<CollectedBarcodeItem[]>;
