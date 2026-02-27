import { DocumentType } from '@/types/document-type';
import type {
  GoodsReceiptFormData,
  SelectedOrderItem,
  SelectedStockItem,
  BulkCreateRequest,
} from '../types/goods-receipt';

function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildGoodsReceiptBulkCreateRequest(
  formData: GoodsReceiptFormData,
  selectedItems: (SelectedOrderItem | SelectedStockItem)[],
  isStockBased: boolean = false,
): BulkCreateRequest {
  const currentYear = new Date().getFullYear().toString();
  const plannedDate = formData.receiptDate ? new Date(formData.receiptDate).toISOString() : new Date().toISOString();

  const lines = isStockBased ? [] : selectedItems.map((item) => {
    const clientKey = generateGuid();
    const orderItem = item as SelectedOrderItem;
    return {
      clientKey,
      stockCode: orderItem.stockCode || orderItem.productCode || '',
      quantity: orderItem.orderedQty || 0,
      unit: orderItem.unit || undefined,
      erpOrderNo: orderItem.siparisNo || undefined,
      erpOrderId: orderItem.orderID?.toString() || undefined,
      description: orderItem.stockName || orderItem.productName || undefined,
    };
  });

  const importLines = selectedItems.map((item) => {
    const clientKey = generateGuid();
    const correspondingLine = isStockBased ? null : lines.find((line) => {
      const itemStockCode = item.stockCode;
      return line.stockCode === itemStockCode;
    });
    const stockCode = item.stockCode;
    const stockName = item.stockName;
    return {
      lineClientKey: correspondingLine?.clientKey || null,
      clientKey,
      stockCode,
      configurationCode: item.configCode || undefined,
      description1: stockName || undefined,
      description2: undefined,
    };
  });

  const serialLines = selectedItems
    .map((item, index) => {
      if (!item.serialNo && !item.lotNo && !item.batchNo && !item.configCode) {
        return null;
      }
      const importLine = importLines[index];
      if (!importLine) return null;
      return {
        importLineClientKey: importLine.clientKey,
        serialNo: item.serialNo || '',
        quantity: item.receiptQuantity || 0,
        sourceCellCode: undefined,
        targetCellCode: undefined,
        serialNo2: item.lotNo,
        serialNo3: item.batchNo,
        serialNo4: item.configCode,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const routes = selectedItems
    .map((item, index) => {
      const importLine = importLines[index];
      if (!importLine || !item.receiptQuantity || item.receiptQuantity <= 0) return null;
      const stockName = item.stockName;
      return {
        importLineClientKey: importLine.clientKey,
        scannedBarcode: '',
        quantity: item.receiptQuantity,
        description: stockName || undefined,
        serialNo: item.serialNo,
        serialNo2: item.lotNo,
        serialNo3: item.batchNo,
        serialNo4: item.configCode,
        sourceWarehouse: undefined,
        targetWarehouse: item.warehouseId,
        sourceCellCode: undefined,
        targetCellCode: undefined,
      };
    })
    .filter((route): route is NonNullable<typeof route> => route !== null);

  const request: BulkCreateRequest = {
    header: {
      branchCode: '',
      projectCode: formData.projectCode || undefined,
      orderId: isStockBased ? undefined : (selectedItems[0] && 'siparisNo' in selectedItems[0] ? selectedItems[0].siparisNo : undefined),
      documentType: DocumentType.GR,
      yearCode: currentYear,
      description1: formData.documentNo || undefined,
      description2: formData.notes || undefined,
      priorityLevel: 0,
      plannedDate,
      isPlanned: false,
      customerCode: formData.customerId || '',
      returnCode: false,
      ocrSource: false,
      description3: undefined,
      description4: undefined,
      description5: undefined,
    },
    documents: null,
    lines: lines.length > 0 ? lines : undefined,
    importLines: importLines.length > 0 ? importLines : undefined,
    serialLines: serialLines.length > 0 ? serialLines : undefined,
    routes: routes.length > 0 ? routes : undefined,
  };

  return request;
}


