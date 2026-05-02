export interface CreateInventoryQualityRuleDto {
  branchCode?: string;
  scopeType: string;
  stockId?: number | null;
  stockGroupCode?: string | null;
  stockGroupName?: string | null;
  inspectionMode: string;
  autoQuarantine: boolean;
  requireLot: boolean;
  requireSerial: boolean;
  requireExpiry: boolean;
  minRemainingShelfLifeDays?: number | null;
  nearExpiryWarningDays?: number | null;
  onFailAction: string;
  isActive: boolean;
  description?: string | null;
}

export interface UpdateInventoryQualityRuleDto extends CreateInventoryQualityRuleDto {}

export interface InventoryQualityRuleDto {
  id: number;
  branchCode?: string | null;
  scopeType: string;
  stockId?: number | null;
  stockCode?: string | null;
  stockName?: string | null;
  stockGroupCode?: string | null;
  stockGroupName?: string | null;
  inspectionMode: string;
  autoQuarantine: boolean;
  requireLot: boolean;
  requireSerial: boolean;
  requireExpiry: boolean;
  minRemainingShelfLifeDays?: number | null;
  nearExpiryWarningDays?: number | null;
  onFailAction: string;
  isActive: boolean;
  description?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InventoryQualityRulePagedRowDto {
  id: number;
  branchCode?: string | null;
  scopeType: string;
  stockId?: number | null;
  stockCode?: string | null;
  stockName?: string | null;
  stockGroupCode?: string | null;
  stockGroupName?: string | null;
  inspectionMode: string;
  autoQuarantine: boolean;
  requireLot: boolean;
  requireSerial: boolean;
  requireExpiry: boolean;
  onFailAction: string;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CreateInventoryQualityParameterDto {
  branchCode?: string;
  autoCreateInspectionOnReceipt: boolean;
  defaultInspectionMode: string;
  defaultOnFailAction: string;
  useQuarantineWarehouse: boolean;
  defaultQuarantineWarehouseId?: number | null;
  defaultApprovedWarehouseId?: number | null;
  defaultRejectWarehouseId?: number | null;
  defaultReturnOutboundType: string;
  allowDirectReceiptWhenNoRule: boolean;
  blockReceiptWhenLotMissing: boolean;
  blockReceiptWhenSerialMissing: boolean;
  blockReceiptWhenExpiryMissing: boolean;
  requireManagerApprovalForRelease: boolean;
  enableTraceabilityEvents: boolean;
  enableNearExpiryWarning: boolean;
}

export interface InventoryQualityParameterDto {
  id: number;
  branchCode?: string | null;
  autoCreateInspectionOnReceipt: boolean;
  defaultInspectionMode: string;
  defaultOnFailAction: string;
  useQuarantineWarehouse: boolean;
  defaultQuarantineWarehouseId?: number | null;
  defaultQuarantineWarehouseCode?: string | null;
  defaultQuarantineWarehouseName?: string | null;
  defaultApprovedWarehouseId?: number | null;
  defaultApprovedWarehouseCode?: string | null;
  defaultApprovedWarehouseName?: string | null;
  defaultRejectWarehouseId?: number | null;
  defaultRejectWarehouseCode?: string | null;
  defaultRejectWarehouseName?: string | null;
  defaultReturnOutboundType: string;
  allowDirectReceiptWhenNoRule: boolean;
  blockReceiptWhenLotMissing: boolean;
  blockReceiptWhenSerialMissing: boolean;
  blockReceiptWhenExpiryMissing: boolean;
  requireManagerApprovalForRelease: boolean;
  enableTraceabilityEvents: boolean;
  enableNearExpiryWarning: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InventoryQualityResolvedPolicyDto {
  source: string;
  ruleId?: number | null;
  parameterId?: number | null;
  inspectionMode: string;
  onFailAction: string;
  autoQuarantine: boolean;
  requireLot: boolean;
  requireSerial: boolean;
  requireExpiry: boolean;
  minRemainingShelfLifeDays?: number | null;
  nearExpiryWarningDays?: number | null;
  allowDirectReceiptWhenNoRule: boolean;
  blockReceiptWhenLotMissing: boolean;
  blockReceiptWhenSerialMissing: boolean;
  blockReceiptWhenExpiryMissing: boolean;
  requireManagerApprovalForRelease: boolean;
  enableTraceabilityEvents: boolean;
  enableNearExpiryWarning: boolean;
  defaultQuarantineWarehouseId?: number | null;
  defaultQuarantineWarehouseCode?: string | null;
  defaultQuarantineWarehouseName?: string | null;
}

export interface CreateInventoryQualityInspectionLineDto {
  stockId: number;
  lotNo?: string | null;
  serialNo?: string | null;
  expiryDate?: string | null;
  quantity: number;
  decision: string;
  reasonCode?: string | null;
  reasonNote?: string | null;
}

export interface InventoryQualityInspectionLineDto extends CreateInventoryQualityInspectionLineDto {
  id: number;
  inspectionId: number;
  stockCode: string;
  stockName: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CreateInventoryQualityInspectionDto {
  branchCode?: string;
  documentType: string;
  documentNumber?: string | null;
  documentId?: number | null;
  warehouseId: number;
  supplierId?: number | null;
  inspectionDate?: string | null;
  status: string;
  note?: string | null;
  lines: CreateInventoryQualityInspectionLineDto[];
}

export interface UpdateInventoryQualityInspectionDto extends CreateInventoryQualityInspectionDto {}

export interface InventoryQualityInspectionDto {
  id: number;
  branchCode?: string | null;
  documentType: string;
  documentNumber?: string | null;
  documentId?: number | null;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  supplierId?: number | null;
  supplierCode?: string | null;
  supplierName?: string | null;
  inspectionDate: string;
  status: string;
  note?: string | null;
  releaseMovementReference?: string | null;
  rejectMovementReference?: string | null;
  returnMovementReference?: string | null;
  lines: InventoryQualityInspectionLineDto[];
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InventoryQualityInspectionPagedRowDto {
  id: number;
  branchCode?: string | null;
  documentType: string;
  documentNumber?: string | null;
  documentId?: number | null;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  supplierId?: number | null;
  supplierCode?: string | null;
  supplierName?: string | null;
  inspectionDate: string;
  status: string;
  lineCount: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InventoryQualityQuarantinePagedRowDto {
  id: number;
  branchCode?: string | null;
  documentType: string;
  documentNumber?: string | null;
  documentId?: number | null;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  supplierId?: number | null;
  supplierCode?: string | null;
  supplierName?: string | null;
  inspectionDate: string;
  status: string;
  lineCount: number;
  totalQuantity: number;
  serialTrackedLineCount: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface InventoryQualityQuarantineDecisionDto {
  action: string;
  note?: string | null;
}
