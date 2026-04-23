import type { ApiResponse, PagedResponse } from '@/types/api';

export type ProductionPlanSource = 'manual' | 'erp';

export interface ProductionHeaderDraft {
  documentNo: string;
  documentDate: string;
  description: string;
  executionMode: 'Serial' | 'Parallel' | 'Hybrid';
  planType: 'Production' | 'Assembly' | 'Packaging' | 'Rework';
  priority: number;
  projectCode: string;
  customerCode: string;
  mainStockId?: number | null;
  mainStockCode: string;
  mainYapKod: string;
  plannedQuantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  assignments: ProductionHeaderAssignmentDraft[];
}

export interface ProductionOrderDraft {
  localId: string;
  orderNo: string;
  orderType: 'Production' | 'SemiFinished' | 'Assembly' | 'Packaging' | 'Rework';
  producedStockId?: number | null;
  producedStockCode: string;
  producedYapKod: string;
  plannedQuantity: number;
  sourceWarehouseCode: string;
  targetWarehouseCode: string;
  sequenceNo?: number;
  parallelGroupNo?: number;
  canStartManually: boolean;
  autoStartWhenDependenciesDone: boolean;
  assignments: ProductionOrderAssignmentDraft[];
}

export interface ProductionHeaderAssignmentDraft {
  localId: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  assignedTeamId?: number;
  assignmentType: 'Primary' | 'Support' | 'Supervisor' | 'Observer';
}

export interface ProductionOrderAssignmentDraft {
  localId: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  assignedTeamId?: number;
  assignmentType: 'Primary' | 'Support' | 'Supervisor' | 'Observer';
  note: string;
}

export interface ProductionOutputDraft {
  localId: string;
  orderLocalId: string;
  stockId?: number | null;
  stockCode: string;
  yapKod: string;
  plannedQuantity: number;
  unit: string;
  trackingMode: 'None' | 'Lot' | 'Serial';
  serialEntryMode: 'Optional' | 'Required';
  targetWarehouseCode: string;
  targetCellCode: string;
}

export interface ProductionConsumptionDraft {
  localId: string;
  orderLocalId: string;
  stockId?: number | null;
  stockCode: string;
  yapKod: string;
  plannedQuantity: number;
  unit: string;
  trackingMode: 'None' | 'Lot' | 'Serial';
  serialEntryMode: 'Optional' | 'Required';
  sourceWarehouseCode: string;
  sourceCellCode: string;
  isBackflush: boolean;
  isMandatory: boolean;
}

export interface ProductionDependencyDraft {
  localId: string;
  predecessorOrderLocalId: string;
  successorOrderLocalId: string;
  dependencyType: 'FinishToStart' | 'StartToStart' | 'FinishToFinish' | 'StartToFinish';
  requiredTransferCompleted: boolean;
  requiredOutputAvailable: boolean;
  lagMinutes: number;
}

export interface ProductionPlanDraft {
  source: ProductionPlanSource;
  header: ProductionHeaderDraft;
  orders: ProductionOrderDraft[];
  outputs: ProductionOutputDraft[];
  consumptions: ProductionConsumptionDraft[];
  dependencies: ProductionDependencyDraft[];
}

export interface ProductionErpTemplateRequest {
  orderNo?: string;
  stockId?: number | null;
  stockCode: string;
  quantity: number;
  yapKod?: string;
}

export interface ProductionHeaderListItem {
  id: number;
  documentNo: string;
  documentDate?: string | null;
  status?: string | null;
  planType?: string | null;
  executionMode?: string | null;
  priority?: number | null;
  mainStockCode?: string | null;
  mainYapKod?: string | null;
  plannedQuantity?: number | null;
  completedQuantity?: number | null;
  projectCode?: string | null;
  description1?: string | null;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
}

export interface ProductionHeaderAssignmentItem {
  id: number;
  assignedUserId?: number | null;
  assignedRoleId?: number | null;
  assignedTeamId?: number | null;
  assignmentType: string;
  assignedAt: string;
  isActive: boolean;
}

export interface ProductionOrderAssignmentItem {
  id: number;
  assignedUserId?: number | null;
  assignedRoleId?: number | null;
  assignedTeamId?: number | null;
  assignmentType: string;
  note?: string | null;
  isActive: boolean;
}

export interface ProductionOrderOutputItem {
  id: number;
  stockCode: string;
  yapKod?: string | null;
  plannedQuantity: number;
  producedQuantity?: number | null;
  unit?: string | null;
  trackingMode: string;
  serialEntryMode: string;
  targetWarehouseCode?: string | null;
  targetCellCode?: string | null;
  status: string;
}

export interface ProductionOrderConsumptionItem {
  id: number;
  stockCode: string;
  yapKod?: string | null;
  plannedQuantity: number;
  consumedQuantity?: number | null;
  unit?: string | null;
  trackingMode: string;
  serialEntryMode: string;
  sourceWarehouseCode?: string | null;
  sourceCellCode?: string | null;
  isBackflush: boolean;
  isMandatory: boolean;
  status: string;
}

export interface ProductionOrderDetail {
  id: number;
  orderNo: string;
  orderType: string;
  status: string;
  priority: number;
  sequenceNo?: number | null;
  parallelGroupNo?: number | null;
  producedStockCode: string;
  producedYapKod?: string | null;
  plannedQuantity: number;
  startedQuantity?: number | null;
  completedQuantity?: number | null;
  scrapQuantity?: number | null;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  canStartManually: boolean;
  autoStartWhenDependenciesDone: boolean;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  assignments: ProductionOrderAssignmentItem[];
  outputs: ProductionOrderOutputItem[];
  consumptions: ProductionOrderConsumptionItem[];
}

export interface ProductionDependencyDetail {
  id: number;
  predecessorOrderId: number;
  predecessorOrderNo: string;
  successorOrderId: number;
  successorOrderNo: string;
  dependencyType: string;
  requiredTransferCompleted: boolean;
  requiredOutputAvailable: boolean;
  lagMinutes: number;
}

export interface ProductionHeaderDetail {
  header: ProductionHeaderListItem;
  headerAssignments: ProductionHeaderAssignmentItem[];
  orders: ProductionOrderDetail[];
  dependencies: ProductionDependencyDetail[];
}

export interface ProductionOperation {
  id: number;
  orderId: number;
  orderNo?: string | null;
  operationNo?: string | null;
  operationType: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  plannedDurationMinutes?: number | null;
  actualDurationMinutes?: number | null;
  pauseDurationMinutes?: number | null;
  netWorkingDurationMinutes?: number | null;
  description?: string | null;
  events: ProductionOperationEvent[];
  lines: ProductionOperationLine[];
}

export interface ProductionOperationEvent {
  id: number;
  eventType: string;
  eventReasonCode?: string | null;
  eventNote?: string | null;
  eventAt: string;
  durationMinutes?: number | null;
  performedByUserId?: number | null;
  workcenterId?: number | null;
  machineId?: number | null;
}

export interface ProductionOperationLine {
  id: number;
  lineRole: string;
  stockCode: string;
  yapKod?: string | null;
  quantity: number;
  unit?: string | null;
  serialNo1?: string | null;
  lotNo?: string | null;
  batchNo?: string | null;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  sourceCellCode?: string | null;
  targetCellCode?: string | null;
  scannedBarcode?: string | null;
  createdDate: string;
}

export interface StartProductionOperationRequest {
  orderId: number;
  operationType?: string;
  workcenterId?: number;
  machineId?: number;
  plannedDurationMinutes?: number;
  description?: string;
}

export interface ProductionOperationEventRequest {
  reasonCode?: string;
  note?: string;
  durationMinutes?: number;
  workcenterId?: number;
  machineId?: number;
}

export interface AddProductionOperationLineRequest {
  stockCode: string;
  yapKod?: string;
  quantity: number;
  unit?: string;
  serialNo1?: string;
  serialNo2?: string;
  serialNo3?: string;
  serialNo4?: string;
  lotNo?: string;
  batchNo?: string;
  sourceWarehouseCode?: string;
  targetWarehouseCode?: string;
  sourceCellCode?: string;
  targetCellCode?: string;
  scannedBarcode?: string;
}

export type ProductionHeadersPagedResponse = PagedResponse<ProductionHeaderListItem>;
export type CreateProductionPlanResponse = ApiResponse<unknown>;
export type ProductionTemplateResponse = ApiResponse<ProductionPlanDraft>;

let sequence = 0;
const nextId = (prefix: string): string => `${prefix}-${Date.now()}-${sequence++}`;

export function createEmptyOrderDraft(): ProductionOrderDraft {
  const localId = nextId('order');
  return {
    localId,
    orderNo: '',
    orderType: 'Production',
    producedStockId: undefined,
    producedStockCode: '',
    producedYapKod: '',
    plannedQuantity: 1,
    sourceWarehouseCode: '',
    targetWarehouseCode: '',
    sequenceNo: undefined,
    parallelGroupNo: undefined,
    canStartManually: false,
    autoStartWhenDependenciesDone: false,
    assignments: [],
  };
}

export function createEmptyHeaderAssignmentDraft(): ProductionHeaderAssignmentDraft {
  return {
    localId: nextId('header-assignment'),
    assignmentType: 'Primary',
  };
}

export function createEmptyOrderAssignmentDraft(): ProductionOrderAssignmentDraft {
  return {
    localId: nextId('order-assignment'),
    assignmentType: 'Primary',
    note: '',
  };
}

export function createEmptyOutputDraft(orderLocalId = ''): ProductionOutputDraft {
  return {
    localId: nextId('output'),
    orderLocalId,
    stockId: undefined,
    stockCode: '',
    yapKod: '',
    plannedQuantity: 1,
    unit: 'ADET',
    trackingMode: 'None',
    serialEntryMode: 'Optional',
    targetWarehouseCode: '',
    targetCellCode: '',
  };
}

export function createEmptyConsumptionDraft(orderLocalId = ''): ProductionConsumptionDraft {
  return {
    localId: nextId('consumption'),
    orderLocalId,
    stockId: undefined,
    stockCode: '',
    yapKod: '',
    plannedQuantity: 1,
    unit: 'ADET',
    trackingMode: 'None',
    serialEntryMode: 'Optional',
    sourceWarehouseCode: '',
    sourceCellCode: '',
    isBackflush: false,
    isMandatory: true,
  };
}

export function createEmptyDependencyDraft(): ProductionDependencyDraft {
  return {
    localId: nextId('dependency'),
    predecessorOrderLocalId: '',
    successorOrderLocalId: '',
    dependencyType: 'FinishToStart',
    requiredTransferCompleted: false,
    requiredOutputAvailable: false,
    lagMinutes: 0,
  };
}

export function createEmptyProductionPlanDraft(): ProductionPlanDraft {
  const firstOrder = createEmptyOrderDraft();
  return {
    source: 'manual',
    header: {
      documentNo: '',
      documentDate: new Date().toISOString().split('T')[0],
      description: '',
      executionMode: 'Serial',
      planType: 'Production',
      priority: 0,
      projectCode: '',
      customerCode: '',
      mainStockId: undefined,
      mainStockCode: '',
      mainYapKod: '',
      plannedQuantity: 1,
      plannedStartDate: '',
      plannedEndDate: '',
      assignments: [],
    },
    orders: [firstOrder],
    outputs: [createEmptyOutputDraft(firstOrder.localId)],
    consumptions: [createEmptyConsumptionDraft(firstOrder.localId)],
    dependencies: [],
  };
}
