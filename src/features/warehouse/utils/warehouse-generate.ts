import { DocumentType } from '@/types/document-type';
import { useAuthStore } from '@/stores/auth-store';
import type {
  WarehouseGenerateRequest,
  WarehouseBulkCreateRequest,
  WarehouseFormData,
  SelectedWarehouseOrderItem,
  SelectedWarehouseStockItem,
} from '../types/warehouse';

function getActiveBranchCode(): string {
  return useAuthStore.getState().branch?.code?.trim() || '0';
}

function sanitizeText(value: string | undefined | null, maxLength: number): string {
  return (value || '').trim().slice(0, maxLength);
}

function sanitizePositiveItems(selectedItems: SelectedWarehouseStockItem[]): SelectedWarehouseStockItem[] {
  return selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0);
}

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
      stockId: item.stockId,
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
      branchCode: getActiveBranchCode(),
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
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouse: '',
      targetWarehouseId: formData.targetWarehouseId,
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
      stockId: item.stockId,
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
      branchCode: getActiveBranchCode(),
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
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseId,
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

export function buildWarehouseOutboundBulkRequest(
  formData: WarehouseFormData,
  selectedItems: SelectedWarehouseStockItem[],
): WarehouseBulkCreateRequest {
  const now = new Date().toISOString();
  const sourceWarehouse = formData.sourceWarehouse ? Number(formData.sourceWarehouse) : undefined;
  const positiveItems = sanitizePositiveItems(selectedItems);

  const lines: WarehouseBulkCreateRequest['lines'] = [];
  const importLines: WarehouseBulkCreateRequest['importLines'] = [];
  const routes: WarehouseBulkCreateRequest['routes'] = [];
  const importLineGroups = new Map<string, { clientKey: string; clientGroupGuid: string }>();

  positiveItems.forEach((item) => {
    const lineClientKey = crypto.randomUUID();
    const lineGroupGuid = crypto.randomUUID();
    const normalizedYapKod = sanitizeText(item.yapKod || '', 50);
    const importGroupingKey = `${item.stockCode}__${normalizedYapKod}`;
    let importLineGroup = importLineGroups.get(importGroupingKey);
    if (!importLineGroup) {
      importLineGroup = {
        clientKey: crypto.randomUUID(),
        clientGroupGuid: crypto.randomUUID(),
      };
      importLineGroups.set(importGroupingKey, importLineGroup);
      importLines.push({
        clientKey: importLineGroup.clientKey,
        clientGroupGuid: importLineGroup.clientGroupGuid,
        stockId: item.stockId,
        stockCode: item.stockCode,
        yapKod: normalizedYapKod,
        quantity: item.transferQuantity,
        unit: sanitizeText(item.unit, 10),
        erpOrderNumber: '',
        erpOrderNo: '',
        erpOrderLineNumber: '',
      });
    }

    lines.push({
      clientKey: lineClientKey,
      clientGuid: lineGroupGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKod: normalizedYapKod,
      quantity: item.transferQuantity,
      unit: sanitizeText(item.unit, 10),
      erpOrderNo: '',
      erpOrderId: '',
      description: sanitizeText(item.stockName, 100),
    });

    routes.push({
      importLineClientKey: importLineGroup.clientKey,
      importLineGroupGuid: importLineGroup.clientGroupGuid,
      stockCode: item.stockCode,
      yapKod: normalizedYapKod,
      quantity: item.transferQuantity,
      serialNo: sanitizeText(item.serialNo, 50),
      serialNo2: sanitizeText(item.serialNo2, 50),
      serialNo3: sanitizeText(item.lotNo, 50),
      serialNo4: sanitizeText(item.batchNo, 50),
      scannedBarcode: sanitizeText(item.stockCode, 100),
      sourceWarehouse,
      targetWarehouse: undefined,
      sourceCellCode: sanitizeText(item.sourceCellCode, 20),
      targetCellCode: sanitizeText(item.targetCellCode, 20),
      description: sanitizeText(item.configCode || '', 100),
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.WO,
      yearCode: new Date().getFullYear().toString(),
      description1: sanitizeText(formData.notes, 255),
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse || '',
      targetWarehouse: '',
      outboundType: formData.operationType || '',
      type: 0,
    },
    lines,
    importLines,
    routes,
  };
}
