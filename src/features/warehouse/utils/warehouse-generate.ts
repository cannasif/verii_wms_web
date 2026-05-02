import { DocumentType } from '@/types/document-type';
import { useAuthStore } from '@/stores/auth-store';
import type {
  WarehouseGenerateRequest,
  WarehouseProcessRequest,
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
  selectedItems: (SelectedWarehouseOrderItem | SelectedWarehouseStockItem)[],
  isStockBased: boolean = false,
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
      yapKod: ('yapKod' in item ? item.yapKod : item.configCode) || '',
      yapAcik: ('yapAcik' in item ? item.yapAcik : '') || '',
      orderId: isStockBased ? 0 : ('orderID' in item ? item.orderID || 0 : 0),
      quantity: item.transferQuantity,
      siparisMiktar: isStockBased ? item.transferQuantity : ('orderedQty' in item ? item.orderedQty || item.transferQuantity : item.transferQuantity),
      unit: '',
      erpOrderNo: isStockBased ? '' : ('siparisNo' in item ? item.siparisNo || '' : ''),
      erpOrderId: isStockBased ? '' : ('orderID' in item ? String(item.orderID || '') : ''),
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceWarehouseId: undefined,
      targetWarehouseId: formData.targetWarehouseId,
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
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
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
  selectedItems: (SelectedWarehouseOrderItem | SelectedWarehouseStockItem)[],
  isStockBased: boolean = false,
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
      yapKod: ('yapKod' in item ? item.yapKod : item.configCode) || '',
      yapAcik: ('yapAcik' in item ? item.yapAcik : '') || '',
      orderId: isStockBased ? 0 : ('orderID' in item ? item.orderID || 0 : 0),
      quantity: item.transferQuantity,
      siparisMiktar: isStockBased ? item.transferQuantity : ('orderedQty' in item ? item.orderedQty || item.transferQuantity : item.transferQuantity),
      unit: '',
      erpOrderNo: isStockBased ? '' : ('siparisNo' in item ? item.siparisNo || '' : ''),
      erpOrderId: isStockBased ? '' : ('orderID' in item ? String(item.orderID || '') : ''),
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceWarehouseId: formData.sourceWarehouseId,
      targetWarehouseId: undefined,
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
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
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

export function buildWarehouseOutboundProcessRequest(
  formData: WarehouseFormData,
  selectedItems: SelectedWarehouseStockItem[],
): WarehouseProcessRequest {
  const now = new Date().toISOString();
  const sourceWarehouse = formData.sourceWarehouse ? Number(formData.sourceWarehouse) : undefined;
  const positiveItems = sanitizePositiveItems(selectedItems);
  const routes: WarehouseProcessRequest['routes'] = [];

  positiveItems.forEach((item) => {
    const normalizedYapKod = sanitizeText(item.yapKod || '', 50);

    routes.push({
      stockCode: item.stockCode,
      stockId: item.stockId,
      yapKod: normalizedYapKod,
      yapKodId: item.yapKodId,
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
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
      outboundType: formData.operationType || '',
      type: 0,
    },
    routes,
  };
}

export function buildWarehouseInboundProcessRequest(
  formData: WarehouseFormData,
  selectedItems: SelectedWarehouseStockItem[],
): WarehouseProcessRequest {
  const now = new Date().toISOString();
  const targetWarehouse = formData.targetWarehouse ? Number(formData.targetWarehouse) : undefined;
  const positiveItems = sanitizePositiveItems(selectedItems);
  const routes: WarehouseProcessRequest['routes'] = [];

  positiveItems.forEach((item) => {
    const normalizedYapKod = sanitizeText(item.yapKod || '', 50);

    routes.push({
      stockCode: item.stockCode,
      stockId: item.stockId,
      yapKod: normalizedYapKod,
      yapKodId: item.yapKodId,
      quantity: item.transferQuantity,
      serialNo: sanitizeText(item.serialNo, 50),
      serialNo2: sanitizeText(item.serialNo2, 50),
      serialNo3: sanitizeText(item.lotNo, 50),
      serialNo4: sanitizeText(item.batchNo, 50),
      scannedBarcode: sanitizeText(item.stockCode, 100),
      sourceWarehouse: undefined,
      targetWarehouse,
      sourceCellCode: sanitizeText(item.sourceCellCode, 20),
      targetCellCode: sanitizeText(item.targetCellCode, 20),
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.WI,
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
      sourceWarehouse: '',
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse || '',
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
      inboundType: formData.operationType || '',
      type: 0,
    },
    routes,
  };
}
