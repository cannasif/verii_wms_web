import type { ApiResponse, PagedResponse } from '@/types/api';

export interface ProductionOrderLookup {
  id: number;
  orderNo: string;
  producedStockCode: string;
  producedYapKod?: string | null;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  headerDocumentNo?: string | null;
}

export interface ProductionTransferLineDraft {
  localId: string;
  stockId?: number;
  stockCode: string;
  yapKod: string;
  quantity: number;
  lineRole: 'ConsumptionSupply' | 'SemiFinishedMove' | 'OutputMove';
  sourceCellCode: string;
  targetCellCode: string;
  productionOrderNo: string;
}

export interface ProductionTransferDraft {
  documentNo: string;
  documentDate: string;
  transferPurpose: 'MaterialSupply' | 'SemiFinishedMove' | 'FinishedGoodsPutaway' | 'ScrapMove' | 'ReturnToStock';
  productionDocumentNo: string;
  productionOrderNo: string;
  sourceWarehouseCode: string;
  targetWarehouseCode: string;
  description: string;
  lines: ProductionTransferLineDraft[];
}

export interface ProductionTransferListItem {
  id: number;
  documentNo: string;
  documentDate?: string | null;
  transferPurpose?: string | null;
  productionHeaderId?: number | null;
  productionOrderId?: number | null;
  sourceWarehouse?: string | null;
  targetWarehouse?: string | null;
  isCompleted?: boolean | null;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
}

export interface ProductionTransferDetailLine {
  id: number;
  stockId?: number | null;
  stockCode: string;
  yapKod?: string | null;
  quantity: number;
  lineRole: 'ConsumptionSupply' | 'SemiFinishedMove' | 'OutputMove';
  sourceCellCode?: string | null;
  targetCellCode?: string | null;
  productionOrderNo?: string | null;
}

export interface ProductionTransferDetail {
  id: number;
  documentNo: string;
  documentDate?: string | null;
  transferPurpose: 'MaterialSupply' | 'SemiFinishedMove' | 'FinishedGoodsPutaway' | 'ScrapMove' | 'ReturnToStock';
  productionDocumentNo?: string | null;
  productionOrderNo?: string | null;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  description?: string | null;
  isCompleted: boolean;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
  lines: ProductionTransferDetailLine[];
}

export interface ProductionTransferSuggestionRequest {
  productionDocumentNo?: string;
  productionOrderNo?: string;
  transferPurpose: 'MaterialSupply' | 'SemiFinishedMove' | 'FinishedGoodsPutaway' | 'ScrapMove' | 'ReturnToStock';
}

export interface ProductionTransferSuggestedLine {
  stockCode: string;
  yapKod?: string | null;
  quantity: number;
  lineRole: 'ConsumptionSupply' | 'SemiFinishedMove' | 'OutputMove';
  productionOrderNo: string;
  sourceWarehouseCode?: string | null;
  targetWarehouseCode?: string | null;
  sourceCellCode?: string | null;
  targetCellCode?: string | null;
}

export type ProductionTransferHeadersPagedResponse = PagedResponse<ProductionTransferListItem>;
export type CreateProductionTransferResponse = ApiResponse<unknown>;

let transferSequence = 0;

export function createEmptyProductionTransferDraft(): ProductionTransferDraft {
  return {
    documentNo: '',
    documentDate: new Date().toISOString().split('T')[0],
    transferPurpose: 'MaterialSupply',
    productionDocumentNo: '',
    productionOrderNo: '',
    sourceWarehouseCode: '',
    targetWarehouseCode: '',
    description: '',
    lines: [createEmptyProductionTransferLineDraft()],
  };
}

export function createEmptyProductionTransferLineDraft(): ProductionTransferLineDraft {
  return {
    localId: `pt-line-${Date.now()}-${transferSequence++}`,
    stockId: undefined,
    stockCode: '',
    yapKod: '',
    quantity: 1,
    lineRole: 'ConsumptionSupply',
    sourceCellCode: '',
    targetCellCode: '',
    productionOrderNo: '',
  };
}
