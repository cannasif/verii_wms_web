import { lookupApi } from '@/features/shared/api/lookup-api';
import { qualityControlApi } from '../api/quality-control.api';
import type { InventoryQualityInspectionDto, InventoryQualityRuleDto } from '../types/quality-control.types';
import { buildGkkRuleDescription } from './gkk-rule-meta';

export interface GkkTestBundleResult {
  rule: InventoryQualityRuleDto;
  inspection: InventoryQualityInspectionDto;
  stockId: number;
  stockCode: string;
  stockName: string;
  warehouseId: number;
  warehouseLabel: string;
}

async function resolveTestTargets(): Promise<{
  stockId: number;
  stockCode: string;
  stockName: string;
  stockGroupCode: string | null;
  warehouseId: number;
  warehouseLabel: string;
}> {
  const warehouses = await lookupApi.getWarehousesPaged({ pageNumber: 1, pageSize: 1, search: '' });
  const warehouse = warehouses.data?.[0];
  if (!warehouse?.id) {
    throw new Error('TEST_WAREHOUSE_REQUIRED');
  }

  const products = await lookupApi.getProductsPaged({ pageNumber: 1, pageSize: 1, search: '' });
  const product = products.data?.[0];
  if (!product?.id) {
    throw new Error('TEST_STOCK_REQUIRED');
  }

  return {
    stockId: product.id,
    stockCode: product.stokKodu,
    stockName: product.stokAdi,
    stockGroupCode: product.grupKodu?.trim() || null,
    warehouseId: warehouse.id,
    warehouseLabel: [warehouse.depoKodu, warehouse.depoIsmi].filter(Boolean).join(' - '),
  };
}

/** Stock-based rule for a real product so GR on that stock can hit GKK. */
export async function createGkkTestRule(): Promise<InventoryQualityRuleDto> {
  const target = await resolveTestTargets();

  return qualityControlApi.createRule({
    branchCode: '0',
    scopeType: 'Stock',
    stockId: target.stockId,
    stockGroupCode: target.stockGroupCode,
    stockGroupName: null,
    inspectionMode: 'InspectionRequired',
    autoQuarantine: true,
    requireLot: false,
    requireSerial: false,
    requireExpiry: false,
    minRemainingShelfLifeDays: null,
    nearExpiryWarningDays: null,
    onFailAction: 'Quarantine',
    isActive: true,
    description: buildGkkRuleDescription(
      `GKK test kuralı — stok: ${target.stockCode} ${target.stockName}. Örnekleme bilgi amaçlı.`,
      { projectCode: 'TEST-PRJ', samplingPercent: 30 },
    ),
  });
}

export async function createGkkTestInspection(): Promise<InventoryQualityInspectionDto> {
  const target = await resolveTestTargets();
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

  return qualityControlApi.createInspection({
    branchCode: '0',
    documentType: 'GoodsReceipt',
    documentNumber: `TEST-GKK-${stamp}`,
    documentId: null,
    warehouseId: target.warehouseId,
    supplierId: null,
    inspectionDate: new Date().toISOString().slice(0, 16),
    status: 'Pending',
    note: `Giriş kalite onay test kaydı. Stok: ${target.stockCode} (${target.stockName}).`,
    lines: [
      {
        stockId: target.stockId,
        lotNo: null,
        serialNo: null,
        expiryDate: null,
        quantity: 1,
        decision: 'Accept',
        reasonCode: 'TEST',
        reasonNote: `GKK test satırı — ${target.stockCode}`,
      },
    ],
  });
}

/** Creates stock rule + pending inspection for the first available warehouse/stock. */
export async function createGkkTestBundle(): Promise<GkkTestBundleResult> {
  const target = await resolveTestTargets();

  const rule = await qualityControlApi.createRule({
    branchCode: '0',
    scopeType: 'Stock',
    stockId: target.stockId,
    stockGroupCode: target.stockGroupCode,
    stockGroupName: null,
    inspectionMode: 'InspectionRequired',
    autoQuarantine: true,
    requireLot: false,
    requireSerial: false,
    requireExpiry: false,
    minRemainingShelfLifeDays: null,
    nearExpiryWarningDays: null,
    onFailAction: 'Quarantine',
    isActive: true,
    description: buildGkkRuleDescription(
      `GKK test kuralı — stok: ${target.stockCode} ${target.stockName}. Örnekleme bilgi amaçlı.`,
      { projectCode: 'TEST-PRJ', samplingPercent: 30 },
    ),
  });

  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const inspection = await qualityControlApi.createInspection({
    branchCode: '0',
    documentType: 'GoodsReceipt',
    documentNumber: `TEST-GKK-${stamp}`,
    documentId: null,
    warehouseId: target.warehouseId,
    supplierId: null,
    inspectionDate: new Date().toISOString().slice(0, 16),
    status: 'Pending',
    note: `Giriş kalite onay test kaydı. Stok: ${target.stockCode} (${target.stockName}).`,
    lines: [
      {
        stockId: target.stockId,
        lotNo: null,
        serialNo: null,
        expiryDate: null,
        quantity: 1,
        decision: 'Accept',
        reasonCode: 'TEST',
        reasonNote: `GKK test satırı — ${target.stockCode}`,
      },
    ],
  });

  return {
    rule,
    inspection,
    stockId: target.stockId,
    stockCode: target.stockCode,
    stockName: target.stockName,
    warehouseId: target.warehouseId,
    warehouseLabel: target.warehouseLabel,
  };
}
