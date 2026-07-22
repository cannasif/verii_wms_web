import type { GoodsReceiptContinueLineSeed, GoodsReceiptContinueSeed } from '@/features/shared';
import type { GoodsReceiptFormData, SelectedOrderItem, SelectedStockItem } from '../types/goods-receipt';

export function buildGoodsReceiptContinueSeed(params: {
  headerId: number;
  formData: GoodsReceiptFormData;
  items: Array<SelectedOrderItem | SelectedStockItem>;
}): GoodsReceiptContinueSeed | null {
  const { headerId, formData, items } = params;
  const documentNo = formData.documentNo?.trim() || '';
  if (!documentNo) return null;

  const lines: GoodsReceiptContinueLineSeed[] = items
    .filter((item) => Number(item.receiptQuantity) > 0 && Boolean(item.stockCode?.trim()))
    .map((item) => ({
      stockId: item.stockId,
      stockCode: item.stockCode,
      stockName: item.stockName || ('productName' in item ? item.productName || item.stockCode : item.stockCode),
      unit: item.unit,
      quantity: item.receiptQuantity,
      serialNo: item.serialNo?.trim() || undefined,
      targetCellCode: item.targetCellCode?.trim() || undefined,
      warehouseId: item.warehouseId,
      yapKodId: item.yapKodId,
      configCode: item.configCode?.trim() || undefined,
    }));

  if (lines.length === 0) return null;

  return {
    source: 'goods-receipt',
    headerId,
    documentNo,
    customerId: formData.customerId || undefined,
    customerRefId: formData.customerRefId,
    projectCode: formData.projectCode || undefined,
    lines,
  };
}
