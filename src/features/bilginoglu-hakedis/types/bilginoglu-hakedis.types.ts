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
  totalAllocatedQty: number;
  totalAtHakEdisQty: number;
  totalReadyForShipmentQty: number;
  totalShipmentCreatedQty: number;
  totalShippedQty: number;
  totalWaitingQty: number;
  allocationPolicy: string;
  shipmentPolicy: string;
  status: string;
  lastEvaluationDate?: string | null;
}

export interface UpdateBilginogluHakEdisOrderPolicy {
  allocationPolicy: string;
  shipmentPolicy: string;
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
