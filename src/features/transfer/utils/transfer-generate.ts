import { DocumentType } from '@/types/document-type';
import type {
  TransferGenerateRequest,
  TransferFormData,
  SelectedTransferOrderItem,
  SelectedTransferStockItem,
} from '../types/transfer';

export function buildTransferGenerateRequest(
  formData: TransferFormData,
  selectedItems: (SelectedTransferOrderItem | SelectedTransferStockItem)[],
  isFreeTransfer: boolean,
): TransferGenerateRequest {
  const now = new Date().toISOString();
  const lines: TransferGenerateRequest['lines'] = [];
  const lineSerials: TransferGenerateRequest['lineSerials'] = [];

  selectedItems.forEach((item) => {
    const clientKey = crypto.randomUUID();
    const clientGuid = crypto.randomUUID();

    lines.push({
      clientKey,
      clientGuid,
      stockCode: item.stockCode,
      yapKod: '',
      orderId: 0,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: '',
      erpOrderId: '',
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: '',
      targetCellCode: '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const firstItemSourceWarehouse = selectedItems.length > 0 && 'sourceWarehouse' in selectedItems[0]
    ? selectedItems[0].sourceWarehouse
    : undefined;

  const userIdsAsNumbers = formData.userIds ? formData.userIds.map((id) => Number(id)) : [];

  const terminalLines = userIdsAsNumbers.length > 0
    ? userIdsAsNumbers.map((userId) => ({
        terminalUserId: userId,
      }))
    : [];

  const request: TransferGenerateRequest = {
    header: {
      branchCode: '0',
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.WT,
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerCode: isFreeTransfer ? '' : (formData.customerId || ''),
      customerName: '',
      sourceWarehouse: isFreeTransfer ? (formData.sourceWarehouse || '') : (firstItemSourceWarehouse ? String(firstItemSourceWarehouse) : ''),
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: isFreeTransfer ? 1 : 0,
    },
    lines,
    lineSerials,
    terminalLines,
    userIds: userIdsAsNumbers.length > 0 ? userIdsAsNumbers : undefined,
  };

  return request;
}


