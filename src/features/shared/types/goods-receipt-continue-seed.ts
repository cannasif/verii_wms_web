export const GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY = 'goodsReceiptContinueSeed' as const;

export interface GoodsReceiptContinueLineSeed {
  stockId?: number;
  stockCode: string;
  stockName: string;
  unit?: string;
  quantity: number;
  serialNo?: string;
  targetCellCode?: string;
  warehouseId?: number;
  yapKodId?: number;
  configCode?: string;
}

/** Soft handoff from GR create/process to transfer or warehouse outbound (same session). */
export interface GoodsReceiptContinueSeed {
  source: 'goods-receipt';
  headerId: number;
  documentNo: string;
  customerId?: string;
  customerRefId?: number;
  projectCode?: string;
  lines: GoodsReceiptContinueLineSeed[];
}

export function isGoodsReceiptContinueSeed(value: unknown): value is GoodsReceiptContinueSeed {
  if (!value || typeof value !== 'object') return false;
  const seed = value as GoodsReceiptContinueSeed;
  return (
    seed.source === 'goods-receipt'
    && typeof seed.documentNo === 'string'
    && seed.documentNo.trim().length > 0
    && Array.isArray(seed.lines)
    && seed.lines.length > 0
  );
}
