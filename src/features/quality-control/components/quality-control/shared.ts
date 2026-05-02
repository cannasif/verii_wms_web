import type {
  CreateInventoryQualityInspectionDto,
  CreateInventoryQualityInspectionLineDto,
  CreateInventoryQualityRuleDto,
} from '../../types/quality-control.types';

export function createEmptyQualityRule(): CreateInventoryQualityRuleDto {
  return {
    branchCode: '0',
    scopeType: 'Stock',
    stockId: null,
    stockGroupCode: '',
    stockGroupName: '',
    inspectionMode: 'NoCheck',
    autoQuarantine: false,
    requireLot: false,
    requireSerial: false,
    requireExpiry: false,
    minRemainingShelfLifeDays: null,
    nearExpiryWarningDays: null,
    onFailAction: 'Quarantine',
    isActive: true,
    description: '',
  };
}

export function createEmptyQualityInspection(): CreateInventoryQualityInspectionDto {
  return {
    branchCode: '0',
    documentType: '',
    documentNumber: '',
    documentId: null,
    warehouseId: 0,
    supplierId: null,
    inspectionDate: new Date().toISOString().slice(0, 16),
    status: 'Pending',
    note: '',
    lines: [],
  };
}

export function createEmptyInspectionLine(): CreateInventoryQualityInspectionLineDto {
  return {
    stockId: 0,
    lotNo: '',
    serialNo: '',
    expiryDate: null,
    quantity: 1,
    decision: 'Accept',
    reasonCode: '',
    reasonNote: '',
  };
}

export function buildStockLabel(stockCode?: string | null, stockName?: string | null): string {
  return [stockCode, stockName].filter(Boolean).join(' - ');
}

export function buildCustomerLabel(code?: string | null, name?: string | null): string {
  return [code, name].filter(Boolean).join(' - ');
}

export function buildWarehouseLabel(code?: string | number | null, name?: string | null): string {
  return [code, name].filter(Boolean).join(' - ');
}
