import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export type { ApiResponse, PagedParams, PagedResponse };

export interface BilginogluHakEdisOrderHeader {
  id: number;
  branchCode: string;
  siparisNo: string;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  orderDate?: string | null;
  transferAllFlag: string;
  orderDetail?: string | null;
  totalOrderQty: number;
  totalRemainingQty: number;
  totalRequiredQty: number;
  totalWarehouseAvailableQty: number;
  totalMissingQty: number;
  canCreateNewBatchQty: number;
  totalAllocatedQty: number;
  totalAtHakEdisQty: number;
  totalReadyForShipmentQty: number;
  totalShipmentCreatedQty: number;
  totalShippedQty: number;
  totalWaitingQty: number;
  isCompleted: boolean;
  completedDate?: string | null;
  allocationPolicy: string;
  shipmentPolicy: string;
  status: string;
  lastEvaluationDate?: string | null;
}

export interface UpdateBilginogluHakEdisOrderPolicy {
  allocationPolicy: string;
  shipmentPolicy: string;
}

export interface BilginogluHakEdisCompletedLocationSetting {
  id: number;
  branchCode: string;
  warehouseId: number;
  warehouseCode?: number | null;
  warehouseName?: string | null;
  shelfId: number;
  shelfCode?: string | null;
  shelfName?: string | null;
  calibrationReturnWarehouseId?: number | null;
  calibrationReturnWarehouseCode?: number | null;
  calibrationReturnWarehouseName?: string | null;
  calibrationReturnShelfId?: number | null;
  calibrationReturnShelfCode?: string | null;
  calibrationReturnShelfName?: string | null;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface UpsertBilginogluHakEdisCompletedLocationSetting {
  branchCode: string;
  warehouseId: number;
  shelfId: number;
  calibrationReturnWarehouseId?: number | null;
  calibrationReturnShelfId?: number | null;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
}

export type BilginogluHakEdisOperationType = 'DAT' | 'SEVK' | 'AMBAR_CIKIS';

export interface BilginogluHakEdisOperationSetting {
  id: number;
  branchCode: string;
  operationCode: string;
  operationDescription: string;
  operationType: BilginogluHakEdisOperationType;
  mainWarehouseId?: number | null;
  mainWarehouseCode?: number | null;
  mainWarehouseName?: string | null;
  intermediateWarehouseId?: number | null;
  intermediateWarehouseCode?: number | null;
  intermediateWarehouseName?: string | null;
  finalWarehouseId?: number | null;
  finalWarehouseCode?: number | null;
  finalWarehouseName?: string | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface UpsertBilginogluHakEdisOperationSetting {
  branchCode: string;
  operationCode: string;
  operationDescription: string;
  operationType: BilginogluHakEdisOperationType;
  mainWarehouseId?: number | null;
  intermediateWarehouseId?: number | null;
  finalWarehouseId?: number | null;
  isActive: boolean;
}

export interface BilginogluHakEdisPlan {
  id: number;
  orderHeaderId?: number | null;
  branchCode: string;
  siparisNo: string;
  orderId: number;
  customerId?: number | null;
  stockId?: number | null;
  yapKodId?: number | null;
  sourceWarehouseId?: number | null;
  hakEdisWarehouseId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  stockCode?: string | null;
  stockName?: string | null;
  yapKod?: string | null;
  sourceWarehouseCode?: number | null;
  hakEdisWarehouseCode?: number | null;
  orderDate?: string | null;
  deliveryDate?: string | null;
  orderQty: number;
  deliveredQty: number;
  remainingOrderQty: number;
  warehouseAvailableQty: number;
  allocatedToHakEdisQty: number;
  atHakEdisQty: number;
  returnedFromHakEdisQty: number;
  readyForShipmentQty: number;
  shipmentCreatedQty: number;
  shippedQty: number;
  waitingQty: number;
  allocationPolicy: string;
  shipmentPolicy: string;
  status: string;
  lastNetsisSyncDate?: string | null;
  lastEvaluationDate?: string | null;
  lastError?: string | null;
}

export interface BilginogluHakEdisBatch {
  id: number;
  planId: number;
  batchNo: string;
  batchSequence: number;
  quantity: number;
  currentStage: string;
  status: string;
  transferToHakEdisHeaderId?: number | null;
  returnFromHakEdisHeaderId?: number | null;
  shipmentHeaderId?: number | null;
  transferChainId?: number | null;
  sourceWarehouseId?: number | null;
  hakEdisWarehouseId?: number | null;
  createdByJobRunId?: number | null;
  readyForShipmentDate?: string | null;
  shipmentCreatedDate?: string | null;
}

export interface BilginogluHakEdisBatchStep {
  id: number;
  batchId: number;
  stepType: string;
  sequenceNo: number;
  sourceType?: string | null;
  sourceHeaderId?: number | null;
  sourceLineId?: number | null;
  quantity: number;
  status: string;
  startedDate?: string | null;
  completedDate?: string | null;
  note?: string | null;
}

export interface BilginogluHakEdisOrderActivity {
  batchId: number;
  batchNo: string;
  planId?: number | null;
  siparisNo: string;
  orderId: number;
  stockCode?: string | null;
  stockName?: string | null;
  quantity: number;
  sequenceNo: number;
  stepType: string;
  status: string;
  sourceType?: string | null;
  sourceHeaderId?: number | null;
  documentNo?: string | null;
  documentType?: string | null;
  documentSeries?: string | null;
  isCompleted?: boolean | null;
  completionDate?: string | null;
  isErpIntegrated?: boolean | null;
  erpReferenceNumber?: string | null;
  erpIntegrationStatus?: string | null;
  erpIntegrationDate?: string | null;
  actionByUserId?: number | null;
  actionByUserName?: string | null;
  actionDate?: string | null;
  collectedByUsers?: string | null;
  collectedUserCount: number;
  note?: string | null;
}

export interface BilginogluHakEdisEvaluationRun {
  id: number;
  runNo: string;
  startedDate: string;
  completedDate?: string | null;
  status: string;
  totalOrderCount: number;
  totalLineCount: number;
  createdPlanCount: number;
  updatedPlanCount: number;
  createdBatchCount: number;
  errorCount: number;
  errorMessage?: string | null;
}

export interface BilginogluHakEdisEvaluationLine {
  id: number;
  runId: number;
  planId?: number | null;
  siparisNo: string;
  orderId: number;
  stockId?: number | null;
  warehouseId?: number | null;
  orderRemainingQty: number;
  warehouseAvailableQty: number;
  alreadyAllocatedQty: number;
  suggestedQty: number;
  decision: string;
  decisionReason?: string | null;
}

export interface BilginogluHakEdisEvaluationResult {
  run: BilginogluHakEdisEvaluationRun;
  lines: BilginogluHakEdisEvaluationLine[];
}

export interface BilginogluHakEdisTransferPreviewLine {
  planId: number;
  siparisNo: string;
  orderId: number;
  stockCode?: string | null;
  stockName?: string | null;
  yapKod?: string | null;
  sourceWarehouseCode?: number | null;
  hakEdisWarehouseCode?: number | null;
  orderQty: number;
  processedQty: number;
  remainingOrderQty: number;
  warehouseAvailableQty: number;
  transferableQty: number;
  shippableQty: number;
  missingQty: number;
  sameWarehouse: boolean;
  willCreateTransfer: boolean;
  decision: string;
  decisionReason?: string | null;
}

export interface BilginogluHakEdisTransferPreview {
  orderHeaderId: number;
  siparisNo: string;
  customerCode?: string | null;
  customerName?: string | null;
  transferAllFlag: string;
  allocationPolicy: string;
  shipmentPolicy: string;
  totalOrderQty: number;
  totalProcessedQty: number;
  totalRemainingOrderQty: number;
  totalWarehouseAvailableQty: number;
  totalTransferableQty: number;
  totalShippableQty: number;
  totalMissingQty: number;
  canCreateTransfers: boolean;
  lines: BilginogluHakEdisTransferPreviewLine[];
}

export interface BilginogluHakEdisCreateTransfersResult {
  preview: BilginogluHakEdisTransferPreview;
  createdBatches: BilginogluHakEdisBatch[];
}

export interface BilginogluHakEdisBulkOperationLine {
  orderHeaderId: number;
  siparisNo: string;
  batchId?: number | null;
  batchNo?: string | null;
  action: string;
  result: string;
  message: string;
}

export interface BilginogluHakEdisBulkOperationResult {
  processedOrderCount: number;
  createdTransferCount: number;
  createdShipmentCount: number;
  advancedBatchCount: number;
  skippedCount: number;
  lines: BilginogluHakEdisBulkOperationLine[];
}
