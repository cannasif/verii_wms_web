import { DocumentType } from '@/types/document-type';
import type {
  WarehouseGenerateRequest,
  WarehouseFormData,
  SelectedWarehouseOrderItem,
} from '../types/warehouse';

export function buildWarehouseInboundRequest(
  formData: WarehouseFormData,
  selectedItems: SelectedWarehouseOrderItem[],
): WarehouseGenerateRequest {
  const now = new Date().toISOString();
  const lines: WarehouseGenerateRequest['lines'] = [];
  const lineSerials: WarehouseGenerateRequest['lineSerials'] = [];

  selectedItems.forEach((item) => {
    const clientKey = crypto.randomUUID();
    const clientGuid = crypto.randomUUID();

    lines.push({
      clientKey,
      clientGuid,
      stockCode: item.stockCode,
      stockName: item.stockName,
      yapKod: item.yapKod || '',
      yapAcik: item.yapAcik || '',
      orderId: item.orderID || 0,
      quantity: item.transferQuantity,
      unit: '',
      erpOrderNo: item.siparisNo || '',
      erpOrderId: String(item.orderID || ''),
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const request: WarehouseGenerateRequest = {
    header: {
      branchCode: '0',
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.WI,
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
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouse: '',
      targetWarehouse: formData.targetWarehouse || '',
      priority: '',
      inboundType: formData.operationType || '',
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds && formData.userIds.length > 0
      ? formData.userIds.map((id) => ({ terminalUserId: Number(id) }))
      : [],
    userIds: formData.userIds ? formData.userIds.map((id) => Number(id)) : undefined,
  };

  return request;
}

export function buildWarehouseOutboundRequest(
  formData: WarehouseFormData,
  selectedItems: SelectedWarehouseOrderItem[],
): WarehouseGenerateRequest {
  const now = new Date().toISOString();
  const lines: WarehouseGenerateRequest['lines'] = [];
  const lineSerials: WarehouseGenerateRequest['lineSerials'] = [];

  selectedItems.forEach((item) => {
    const clientKey = crypto.randomUUID();
    const clientGuid = crypto.randomUUID();

    lines.push({
      clientKey,
      clientGuid,
      stockCode: item.stockCode,
      stockName: item.stockName,
      yapKod: item.yapKod || '',
      yapAcik: item.yapAcik || '',
      orderId: item.orderID || 0,
      quantity: item.transferQuantity,
      unit: '',
      erpOrderNo: item.siparisNo || '',
      erpOrderId: String(item.orderID || ''),
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const request: WarehouseGenerateRequest = {
    header: {
      branchCode: '0',
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.WO,
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
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouse: formData.sourceWarehouse || '',
      targetWarehouse: '',
      priority: '',
      outboundType: formData.operationType || '',
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds && formData.userIds.length > 0
      ? formData.userIds.map((id) => ({ terminalUserId: Number(id) }))
      : [],
    userIds: formData.userIds ? formData.userIds.map((id) => Number(id)) : undefined,
  };

  return request;
}


