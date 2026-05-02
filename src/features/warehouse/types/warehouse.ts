import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
import type {
  BaseDocumentHeaderDto,
  BaseDocumentHeaderRequest,
  BaseDocumentLineDto,
  BaseDocumentLineRequest,
  BaseDocumentLineSerialDto,
  BaseDocumentLineSerialRequest,
  BaseSelectedStockItem,
  BaseWorkflowOrder,
  BaseWorkflowOrderItem,
} from '@/types/document-models';
import type { TFunction } from 'i18next';

export const WarehouseOutboundType = {
  SHIPPING_INVOICE: 1,
  WASTE_OUT: 2,
  CORRECTION_OUT: 3,
  TRANSFER_OUT: 4,
} as const;

export const WarehouseInboundType = {
  SHIPPING_INVOICE_IN: 1,
  WASTE_IN: 2,
  CORRECTION_IN: 3,
  TRANSFER_IN: 4,
} as const;

export type WarehouseOutboundTypeValue = typeof WarehouseOutboundType[keyof typeof WarehouseOutboundType];
export type WarehouseInboundTypeValue = typeof WarehouseInboundType[keyof typeof WarehouseInboundType];

export const warehouseOutboundTypeOptions = [
  { value: WarehouseOutboundType.SHIPPING_INVOICE.toString(), labelKey: 'warehouse.operationTypes.outbound.shippingInvoice' },
  { value: WarehouseOutboundType.WASTE_OUT.toString(), labelKey: 'warehouse.operationTypes.outbound.wasteOut' },
  { value: WarehouseOutboundType.CORRECTION_OUT.toString(), labelKey: 'warehouse.operationTypes.outbound.correctionOut' },
  { value: WarehouseOutboundType.TRANSFER_OUT.toString(), labelKey: 'warehouse.operationTypes.outbound.transferOut' },
];

export const warehouseInboundTypeOptions = [
  { value: WarehouseInboundType.SHIPPING_INVOICE_IN.toString(), labelKey: 'warehouse.operationTypes.inbound.shippingInvoiceIn' },
  { value: WarehouseInboundType.WASTE_IN.toString(), labelKey: 'warehouse.operationTypes.inbound.wasteIn' },
  { value: WarehouseInboundType.CORRECTION_IN.toString(), labelKey: 'warehouse.operationTypes.inbound.correctionIn' },
  { value: WarehouseInboundType.TRANSFER_IN.toString(), labelKey: 'warehouse.operationTypes.inbound.transferIn' },
];

export const createWarehouseFormSchema = (t: TFunction, type: 'inbound' | 'outbound') => z.object({
  operationType: z.string().min(1, t('warehouse.validation.operationTypeRequired')),
  transferDate: z.string().min(1, t('warehouse.validation.transferDateRequired')),
  documentNo: z.string().min(1, t('warehouse.validation.documentNoRequired')),
  documentSeriesDefinitionId: z.number().min(1, t('documentSeries.messages.definitionRequired')),
  requiresEDispatch: z.boolean().optional(),
  projectCode: z.string().optional(),
  customerId: z.string().min(1, t('warehouse.validation.customerRequired')),
  sourceWarehouse: type === 'outbound' 
    ? z.string().min(1, t('warehouse.validation.sourceWarehouseRequired'))
    : z.string().optional(),
  targetWarehouse: type === 'inbound'
    ? z.string().min(1, t('warehouse.validation.targetWarehouseRequired'))
    : z.string().optional(),
  notes: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  customerRefId: z.number().optional(),
  sourceWarehouseId: z.number().optional(),
  targetWarehouseId: z.number().optional(),
});

export type WarehouseFormData = z.infer<ReturnType<typeof createWarehouseFormSchema>>;

export interface WarehouseOrder extends BaseWorkflowOrder {
  orderID: number;
}

export interface WarehouseOrderItem extends BaseWorkflowOrderItem {
  yapKod?: string;
  yapAcik?: string;
}

export interface SelectedWarehouseOrderItem extends WarehouseOrderItem {
  stockId?: number;
  yapKodId?: number;
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

export interface WarehouseStockItem extends BaseSelectedStockItem {
  yapKod?: string;
  yapAcik?: string;
}

export interface SelectedWarehouseStockItem extends WarehouseStockItem {
  yapKodId?: number;
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

export interface WarehouseGenerateRequest {
  header: BaseDocumentHeaderRequest & {
    inboundType?: string;
    outboundType?: string;
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

export interface WarehouseBulkCreateRequest {
  header: Omit<
    BaseDocumentHeaderRequest,
    'customerName' | 'priority'
  > & {
    isCompleted: boolean;
    completedDate?: string;
    outboundType: string;
    type: number;
  };
  lines?: Array<{
    clientKey: string;
    clientGuid: string;
    stockId?: number;
    stockCode: string;
    yapKod?: string;
    quantity: number;
    unit?: string;
    erpOrderNo?: string;
    erpOrderId?: string;
    description?: string;
  }>;
  lineSerials?: Array<BaseDocumentLineSerialRequest & {
    lineClientKey: string;
    lineGroupGuid: string;
  }>;
  importLines?: Array<{
    clientKey: string;
    clientGroupGuid: string;
    lineClientKey?: string;
    lineGroupGuid?: string;
    stockId?: number;
    stockCode: string;
    yapKod?: string;
    quantity: number;
    unit?: string;
    serialNo?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
    scannedBarkod?: string;
    erpOrderNumber?: string;
    erpOrderNo?: string;
    erpOrderLineNumber?: string;
  }>;
  routes?: Array<{
    lineClientKey?: string;
    lineGroupGuid?: string;
    stockCode: string;
    stockId?: number;
    yapKod?: string;
    yapKodId?: number;
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
    description?: string;
  }>;
}

export interface WarehouseProcessRequest {
  header: Omit<
    BaseDocumentHeaderRequest,
    'customerName' | 'priority'
  > & {
    isCompleted: boolean;
    completedDate?: string;
    inboundType?: string;
    outboundType?: string;
    type: number;
  };
  routes?: Array<{
    stockCode: string;
    stockId?: number;
    yapKod?: string;
    yapKodId?: number;
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

export type WarehouseOrdersResponse = ApiResponse<WarehouseOrder[]>;
export type WarehouseOrderItemsResponse = ApiResponse<WarehouseOrderItem[]>;

export interface WarehouseHeader extends BaseDocumentHeaderDto {
  priorityLevel: number;
  inboundType?: string;
  outboundType?: string;
}

export interface WarehouseLine extends Pick<
  BaseDocumentLineDto,
  'id' | 'headerId' | 'stockCode' | 'quantity' | 'siparisMiktar' | 'unit' | 'erpOrderNo' | 'erpOrderId' | 'erpLineReference' | 'description'
> {
  stockName: string;
  yapKod?: string;
  yapAcik?: string;
  clientKey: string;
  clientGuid: string;
}

export interface WarehouseLineSerial extends BaseDocumentLineSerialDto {
  lineId: number;
  lineClientKey: string;
  lineGroupGuid: string;
}

export type WarehouseHeadersResponse = ApiResponse<WarehouseHeader[]>;
export type WarehouseLinesResponse = ApiResponse<WarehouseLine[]>;
export type WarehouseLineSerialsResponse = ApiResponse<WarehouseLineSerial[]>;
