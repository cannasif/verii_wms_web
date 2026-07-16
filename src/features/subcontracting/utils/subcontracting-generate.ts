import { DocumentType } from '@/types/document-type';
import { useAuthStore } from '@/stores/auth-store';
import type {
  SubcontractingGenerateRequest,
  SubcontractingProcessRequest,
  SubcontractingFormData,
  SelectedSubcontractingOrderItem,
  SelectedSubcontractingStockItem,
} from '../types/subcontracting';

function getActiveBranchCode(): string {
  return useAuthStore.getState().branch?.code?.trim() || '0';
}

export function buildSubcontractingIssueRequest(
  formData: SubcontractingFormData,
  selectedItems: (SelectedSubcontractingOrderItem | SelectedSubcontractingStockItem)[],
  isStockBased: boolean = false,
): SubcontractingGenerateRequest {
  const now = new Date().toISOString();
  const lines: SubcontractingGenerateRequest['lines'] = [];
  const lineSerials: SubcontractingGenerateRequest['lineSerials'] = [];

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
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const request: SubcontractingGenerateRequest = {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.SIT,
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse,
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: isStockBased ? 1 : 0,
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder,
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

export function buildSubcontractingReceiptRequest(
  formData: SubcontractingFormData,
  selectedItems: (SelectedSubcontractingOrderItem | SelectedSubcontractingStockItem)[],
  isStockBased: boolean = false,
): SubcontractingGenerateRequest {
  const now = new Date().toISOString();
  const lines: SubcontractingGenerateRequest['lines'] = [];
  const lineSerials: SubcontractingGenerateRequest['lineSerials'] = [];

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
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const request: SubcontractingGenerateRequest = {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: DocumentType.SRT,
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse,
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: isStockBased ? 1 : 0,
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder,
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

function buildSubcontractingProcessRequest(
  formData: SubcontractingFormData,
  selectedItems: SelectedSubcontractingStockItem[],
  documentType: DocumentType,
): SubcontractingProcessRequest {
  const now = new Date().toISOString();
  const positiveItems = selectedItems.filter(
    (item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0,
  );
  const sourceWarehouse = Number(formData.sourceWarehouse);
  const targetWarehouse = Number(formData.targetWarehouse);
  const lines: SubcontractingProcessRequest['lines'] = [];
  const lineSerials: SubcontractingProcessRequest['lineSerials'] = [];
  const importLines: SubcontractingProcessRequest['importLines'] = [];
  const routes: SubcontractingProcessRequest['routes'] = [];

  positiveItems.forEach((item) => {
    const lineClientKey = crypto.randomUUID();
    const lineGroupGuid = crypto.randomUUID();
    const importLineClientKey = crypto.randomUUID();
    const importLineGroupGuid = crypto.randomUUID();
    const yapKod = item.configCode || '';

    lines.push({
      clientKey: lineClientKey,
      clientGuid: lineGroupGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: item.yapKodId,
      yapKod,
      quantity: item.transferQuantity,
      unit: item.unit,
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceWarehouseId: formData.sourceWarehouseId,
      targetWarehouseId: formData.targetWarehouseId,
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey,
      lineGroupGuid,
    });

    importLines.push({
      clientKey: importLineClientKey,
      clientGroupGuid: importLineGroupGuid,
      lineClientKey,
      lineGroupGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: item.yapKodId,
      yapKod,
    });

    routes.push({
      importLineClientKey,
      importLineGroupGuid,
      stockCode: item.stockCode,
      yapKod,
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      scannedBarcode: item.stockCode,
      sourceWarehouseId: formData.sourceWarehouseId,
      targetWarehouseId: formData.targetWarehouseId,
      sourceWarehouse: Number.isFinite(sourceWarehouse) ? sourceWarehouse : undefined,
      targetWarehouse: Number.isFinite(targetWarehouse) ? targetWarehouse : undefined,
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType,
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentSeriesDefinitionId: formData.documentSeriesDefinitionId,
      requiresEDispatch: formData.requiresEDispatch,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse,
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: 1,
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder,
    },
    lines,
    lineSerials,
    importLines,
    routes,
  };
}

export function buildSubcontractingIssueProcessRequest(
  formData: SubcontractingFormData,
  selectedItems: SelectedSubcontractingStockItem[],
): SubcontractingProcessRequest {
  return buildSubcontractingProcessRequest(formData, selectedItems, DocumentType.SIT);
}

export function buildSubcontractingReceiptProcessRequest(
  formData: SubcontractingFormData,
  selectedItems: SelectedSubcontractingStockItem[],
): SubcontractingProcessRequest {
  return buildSubcontractingProcessRequest(formData, selectedItems, DocumentType.SRT);
}
