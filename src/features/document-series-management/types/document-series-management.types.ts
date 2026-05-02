export interface WmsDocumentSeriesDefinitionDto {
  id: number;
  branchCode?: string;
  code: string;
  name: string;
  operationType: string;
  documentFlow: string;
  companyCode?: string | null;
  warehouseId?: number | null;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  seriesPrefix: string;
  yearMode: string;
  numberLength: number;
  startNumber: number;
  currentNumber: number;
  incrementBy: number;
  isEDispatchSeries: boolean;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
  createdDate?: string;
}

export type WmsDocumentSeriesDefinitionPagedRowDto = WmsDocumentSeriesDefinitionDto;

export interface CreateWmsDocumentSeriesDefinitionDto {
  branchCode: string;
  code: string;
  name: string;
  operationType: string;
  documentFlow: string;
  companyCode?: string | null;
  warehouseId?: number | null;
  seriesPrefix: string;
  yearMode: string;
  numberLength: number;
  startNumber: number;
  currentNumber: number;
  incrementBy: number;
  isEDispatchSeries: boolean;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
}

export type UpdateWmsDocumentSeriesDefinitionDto = CreateWmsDocumentSeriesDefinitionDto;

export interface WmsDocumentSeriesRuleDto {
  id: number;
  branchCode?: string;
  documentSeriesDefinitionId: number;
  documentSeriesDefinitionCode: string;
  documentSeriesDefinitionName: string;
  operationType: string;
  companyCode?: string | null;
  warehouseId?: number | null;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  userId?: number | null;
  userFullName?: string | null;
  requiresEDispatch: boolean;
  priority: number;
  isActive: boolean;
  description?: string | null;
  createdDate?: string;
}

export type WmsDocumentSeriesRulePagedRowDto = WmsDocumentSeriesRuleDto;

export interface CreateWmsDocumentSeriesRuleDto {
  branchCode: string;
  documentSeriesDefinitionId: number;
  operationType: string;
  companyCode?: string | null;
  warehouseId?: number | null;
  customerId?: number | null;
  userId?: number | null;
  requiresEDispatch: boolean;
  priority: number;
  isActive: boolean;
  description?: string | null;
}

export type UpdateWmsDocumentSeriesRuleDto = CreateWmsDocumentSeriesRuleDto;

export interface ResolveWmsDocumentSeriesRequestDto {
  operationType: string;
  branchCode?: string | null;
  companyCode?: string | null;
  warehouseId?: number | null;
  customerId?: number | null;
  userId?: number | null;
  requiresEDispatch: boolean;
}

export interface ResolveWmsDocumentSeriesResultDto {
  documentSeriesDefinitionId: number;
  code: string;
  name: string;
  operationType: string;
  documentFlow: string;
  seriesPrefix: string;
  yearMode: string;
  numberLength: number;
  currentNumber: number;
  previewDocumentNo: string;
  isEDispatchSeries: boolean;
  matchedBy: string;
  ruleId?: number | null;
  preferenceId?: number | null;
  eDispatchProfileId?: number | null;
  eDispatchProfileCode?: string | null;
  eDispatchProfileName?: string | null;
}
