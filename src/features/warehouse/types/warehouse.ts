import { z } from 'zod';
import type { ApiResponse } from '@/types/api';
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
});

export type WarehouseFormData = z.infer<ReturnType<typeof createWarehouseFormSchema>>;

export interface WarehouseOrder {
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

export interface WarehouseOrderItem {
  id?: string;
  mode: string;
  siparisNo: string;
  orderID: number;
  stockCode: string;
  stockName: string;
  yapKod?: string;
  yapAcik?: string;
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
}

export interface SelectedWarehouseOrderItem extends WarehouseOrderItem {
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

export interface WarehouseStockItem {
  id: string;
  stockCode: string;
  stockName: string;
  unit: string;
}

export interface SelectedWarehouseStockItem extends WarehouseStockItem {
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
    inboundType?: string;
    outboundType?: string;
  };
  lines: {
    clientKey: string;
    clientGuid: string;
    stockCode: string;
    stockName?: string;
    yapKod: string;
    yapAcik?: string;
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

export interface WarehouseBulkCreateRequest {
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
    isCompleted: boolean;
    completedDate?: string;
    documentNo: string;
    documentDate: string;
    customerCode?: string;
    sourceWarehouse?: string;
    targetWarehouse?: string;
    outboundType: string;
    type: number;
  };
  lines?: Array<{
    clientKey: string;
    clientGuid: string;
    stockCode: string;
    yapKod?: string;
    quantity: number;
    unit?: string;
    erpOrderNo?: string;
    erpOrderId?: string;
    description?: string;
  }>;
  lineSerials?: Array<{
    quantity: number;
    serialNo?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
    sourceCellCode?: string;
    targetCellCode?: string;
    lineClientKey: string;
    lineGroupGuid: string;
  }>;
  importLines?: Array<{
    clientKey: string;
    clientGroupGuid: string;
    lineClientKey: string;
    lineGroupGuid: string;
    stockCode: string;
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
    lineClientKey: string;
    lineGroupGuid: string;
    importLineClientKey: string;
    importLineGroupGuid: string;
    stockCode: string;
    quantity: number;
    serialNo?: string;
    serialNo2?: string;
    sourceWarehouse?: number;
    targetWarehouse?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
    description?: string;
  }>;
}

export type WarehouseOrdersResponse = ApiResponse<WarehouseOrder[]>;
export type WarehouseOrderItemsResponse = ApiResponse<WarehouseOrderItem[]>;

export interface WarehouseHeader {
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
  inboundType?: string;
  outboundType?: string;
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
}

export interface WarehouseLine {
  id: number;
  headerId: number;
  stockCode: string;
  stockName: string;
  yapKod?: string;
  yapAcik?: string;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  erpLineReference: string;
  description: string;
  clientKey: string;
  clientGuid: string;
}

export interface WarehouseLineSerial {
  id: number;
  lineId: number;
  quantity: number;
  serialNo: string;
  serialNo2: string;
  serialNo3: string;
  serialNo4: string;
  sourceCellCode: string;
  targetCellCode: string;
  lineClientKey: string;
  lineGroupGuid: string;
}

export type WarehouseHeadersResponse = ApiResponse<WarehouseHeader[]>;
export type WarehouseLinesResponse = ApiResponse<WarehouseLine[]>;
export type WarehouseLineSerialsResponse = ApiResponse<WarehouseLineSerial[]>;
