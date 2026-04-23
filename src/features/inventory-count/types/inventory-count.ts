export type InventoryCountType = 'General' | 'Warehouse' | 'Stock' | 'Rack' | 'Cell' | 'Combined';
export type InventoryCountMode = 'Blind' | 'Open';
export type InventoryCountStatus = 'Draft' | 'Released' | 'Counting' | 'Review' | 'Approved' | 'Completed';
export type InventoryScopeType = 'Warehouse' | 'Stock' | 'Rack' | 'Cell';

export interface InventoryCountHeader {
  id: number;
  documentNo?: string | null;
  documentDate?: string | null;
  description1?: string | null;
  description2?: string | null;
  countType: InventoryCountType;
  scopeMode: string;
  countMode: InventoryCountMode;
  status: InventoryCountStatus | string;
  freezeMode: string;
  warehouseCode?: string | null;
  warehouseId?: number | null;
  stockCode?: string | null;
  stockId?: number | null;
  yapKod?: string | null;
  yapKodId?: number | null;
  rackCode?: string | null;
  cellCode?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  startedDate?: string | null;
  isFirstCount: boolean;
  requiresRecount: boolean;
  assignedUserId?: number | null;
  assignedRoleId?: number | null;
  assignedTeamId?: number | null;
  lineCount?: number | null;
  countedLineCount?: number | null;
  differenceLineCount?: number | null;
  recountRequiredLineCount?: number | null;
}

export interface InventoryCountScope {
  id: number;
  headerId: number;
  sequenceNo?: number | null;
  scopeType: InventoryScopeType | string;
  warehouseId?: number | null;
  warehouseCode?: string | null;
  stockId?: number | null;
  stockCode?: string | null;
  yapKodId?: number | null;
  yapKod?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  isActive: boolean;
}

export interface InventoryCountLine {
  id: number;
  headerId: number;
  scopeId?: number | null;
  sequenceNo: number;
  warehouseId?: number | null;
  warehouseCode?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  stockId: number;
  stockCode: string;
  yapKod?: string | null;
  yapKodId?: number | null;
  unit?: string | null;
  expectedQuantity: number;
  countedQuantity?: number | null;
  differenceQuantity?: number | null;
  countStatus: string;
  entryCount: number;
  isMatched: boolean;
  isDifference: boolean;
  isExtraStock: boolean;
  isMissingStock: boolean;
  isRecountRequired: boolean;
  firstCountedAt?: string | null;
  lastCountedAt?: string | null;
  countedByUserId?: number | null;
  approvalNote?: string | null;
  differenceReason?: string | null;
}

export interface InventoryCountEntry {
  id: number;
  headerId: number;
  lineId: number;
  entryNo: number;
  entryType: string;
  enteredQuantity: number;
  warehouseCode?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  enteredAt: string;
  enteredByUserId?: number | null;
  deviceCode?: string | null;
  note?: string | null;
}

export interface InventoryCountCreateDraft {
  documentNo: string;
  documentDate: string;
  description1: string;
  countType: InventoryCountType;
  countMode: InventoryCountMode;
  freezeMode: 'None' | 'Soft' | 'Hard';
  plannedStartDate: string;
  plannedEndDate: string;
  isFirstCount: boolean;
  warehouseCode: string;
  stockId?: number | null;
  stockCode: string;
  yapKod: string;
  rackCode: string;
  cellCode: string;
  scopes: InventoryCountScopeDraft[];
}

export interface InventoryCountScopeDraft {
  sequenceNo: number;
  scopeType: InventoryScopeType;
  warehouseCode: string;
  stockId?: number | null;
  stockCode: string;
  yapKod: string;
  rackCode: string;
  cellCode: string;
}

export interface CreateInventoryCountHeaderRequest {
  documentNo: string;
  documentDate: string | null;
  description1: string;
  countType: InventoryCountType;
  scopeMode: string;
  countMode: InventoryCountMode;
  freezeMode: string;
  warehouseCode?: string | null;
  stockCode?: string | null;
  yapKod?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  isFirstCount: boolean;
  assignedUserId?: number | null;
}

export interface CreateInventoryCountScopeRequest {
  headerId: number;
  sequenceNo: number;
  scopeType: InventoryScopeType;
  warehouseCode?: string | null;
  stockCode?: string | null;
  yapKod?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  isActive: boolean;
}

export interface CreateInventoryCountEntryRequest {
  lineId: number;
  entryType?: string;
  enteredQuantity: number;
  warehouseCode?: string | null;
  rackCode?: string | null;
  cellCode?: string | null;
  note?: string | null;
}

export function createEmptyInventoryCountDraft(): InventoryCountCreateDraft {
  return {
    documentNo: '',
    documentDate: new Date().toISOString().slice(0, 10),
    description1: '',
    countType: 'General',
    countMode: 'Blind',
    freezeMode: 'None',
    plannedStartDate: '',
    plannedEndDate: '',
    isFirstCount: true,
    warehouseCode: '',
    stockCode: '',
    yapKod: '',
    rackCode: '',
    cellCode: '',
    scopes: [createEmptyInventoryCountScopeDraft(1)],
  };
}

export function createEmptyInventoryCountScopeDraft(sequenceNo: number): InventoryCountScopeDraft {
  return {
    sequenceNo,
    scopeType: 'Warehouse',
    warehouseCode: '',
    stockCode: '',
    yapKod: '',
    rackCode: '',
    cellCode: '',
  };
}
