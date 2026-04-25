interface BaseEntityDto {
  id: number;
  branchCode?: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

interface BaseHeaderEntityDto extends BaseEntityDto {
  documentNo?: string | null;
  documentDate?: string | null;
  documentType?: string | null;
  yearCode?: string | null;
  description1?: string | null;
  description2?: string | null;
  isCompleted?: boolean;
  completionDate?: string | null;
  isERPIntegrated?: boolean;
  erpReferenceNumber?: string | null;
  erpIntegrationDate?: string | null;
  erpIntegrationStatus?: string | null;
  erpErrorMessage?: string | null;
}

interface BaseLineEntityDto extends BaseEntityDto {
  stockCode: string;
  stockId?: number | null;
  yapKod?: string | null;
  yapKodId?: number | null;
  quantity: number;
  siparisMiktar?: number | null;
  unit?: string | null;
  erpOrderNo?: string | null;
  erpOrderId?: string | null;
  description?: string | null;
}

export interface KkdEmployeeDepartmentDto extends BaseEntityDto {
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
}

export interface CreateKkdEmployeeDepartmentDto {
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdEmployeeDepartmentDto {
  departmentCode?: string;
  departmentName?: string;
  isActive?: boolean;
  branchCode?: string;
}

export interface KkdEmployeeRoleDto extends BaseEntityDto {
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  roleCode: string;
  roleName: string;
  isActive: boolean;
}

export interface CreateKkdEmployeeRoleDto {
  departmentId: number;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdEmployeeRoleDto {
  departmentId?: number | null;
  roleCode?: string;
  roleName?: string;
  isActive?: boolean;
  branchCode?: string;
}

export interface KkdEmployeeDto extends BaseEntityDto {
  userId?: number | null;
  customerId: number;
  customerCode: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  roleId?: number | null;
  roleCode?: string | null;
  roleName?: string | null;
  employmentStartDate: string;
  qrCode: string;
  isActive: boolean;
  lastSyncDate?: string | null;
}

export interface CreateKkdEmployeeDto {
  userId: number;
  customerId: number;
  customerCode: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  roleId?: number | null;
  roleCode?: string | null;
  roleName?: string | null;
  employmentStartDate: string;
  qrCode: string;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdEmployeeDto extends Partial<CreateKkdEmployeeDto> {}

export interface ResolveKkdEmployeeQrDto {
  qrCode: string;
}

export interface KkdResolvedEmployeeDto {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  customerId: number;
  customerCode: string;
  departmentCode?: string | null;
  departmentName?: string | null;
  roleCode?: string | null;
  roleName?: string | null;
  isActive: boolean;
}

export interface KkdEntitlementPolicyDto extends BaseEntityDto {
  customerId: number;
  employeeId?: number | null;
  departmentId?: number | null;
  roleId?: number | null;
  groupCode: string;
  groupName?: string | null;
  totalQuantity: number;
  periodType: string;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  hasFrequencyRule: boolean;
  frequencyDays?: number | null;
  quantityPerFrequency?: number | null;
  allowBulkIssue: boolean;
  isActive: boolean;
}

export interface CreateKkdEntitlementPolicyDto {
  customerId: number;
  employeeId?: number | null;
  departmentId?: number | null;
  roleId?: number | null;
  groupCode: string;
  groupName?: string | null;
  totalQuantity: number;
  periodType: string;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  hasFrequencyRule: boolean;
  frequencyDays?: number | null;
  quantityPerFrequency?: number | null;
  allowBulkIssue: boolean;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdEntitlementPolicyDto extends Partial<CreateKkdEntitlementPolicyDto> {}

export type KkdEntitlementScopeType = 'Customer' | 'Department' | 'Role' | 'DepartmentRole' | 'Employee';

export interface KkdEntitlementMatrixRowDto extends BaseEntityDto {
  headerId: number;
  departmentId: number;
  departmentCode?: string | null;
  departmentName?: string | null;
  roleId: number;
  roleCode?: string | null;
  roleName?: string | null;
  matrixCode: string;
  matrixName: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  groupCode: string;
  groupName?: string | null;
  stockCode?: string | null;
  stockName?: string | null;
  standardCode?: string | null;
  standardName?: string | null;
  initialIssueQuantity: number;
  initialAllowBulkIssue: boolean;
  initialFrequencyDays?: number | null;
  initialQuantityPerFrequency?: number | null;
  additionalAfterMonths?: number | null;
  additionalAfterMonthsQuantity?: number | null;
  threeMonthAllowBulkIssue: boolean;
  threeMonthFrequencyDays?: number | null;
  threeMonthQuantityPerFrequency?: number | null;
  routinePeriodType: string;
  routinePeriodInterval: number;
  routineQuantity: number;
  routineAllowBulkIssue: boolean;
  routineFrequencyDays?: number | null;
  routineQuantityPerFrequency?: number | null;
  annualIssueCount?: number | null;
  annualQuantity?: number | null;
  maxCarryQuantity?: number | null;
  allowBulkIssue: boolean;
  isMandatory: boolean;
  sortOrder: number;
  isActive: boolean;
  description?: string | null;
}

export interface CreateKkdEntitlementMatrixRowDto {
  departmentId: number;
  roleId: number;
  matrixCode: string;
  matrixName: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  groupCode: string;
  groupName?: string | null;
  stockCode?: string | null;
  stockName?: string | null;
  standardCode?: string | null;
  standardName?: string | null;
  initialIssueQuantity: number;
  initialAllowBulkIssue: boolean;
  initialFrequencyDays?: number | null;
  initialQuantityPerFrequency?: number | null;
  additionalAfterMonths?: number | null;
  additionalAfterMonthsQuantity?: number | null;
  threeMonthAllowBulkIssue: boolean;
  threeMonthFrequencyDays?: number | null;
  threeMonthQuantityPerFrequency?: number | null;
  routinePeriodType: string;
  routinePeriodInterval: number;
  routineQuantity: number;
  routineAllowBulkIssue: boolean;
  routineFrequencyDays?: number | null;
  routineQuantityPerFrequency?: number | null;
  annualIssueCount?: number | null;
  annualQuantity?: number | null;
  maxCarryQuantity?: number | null;
  allowBulkIssue: boolean;
  isMandatory: boolean;
  sortOrder: number;
  isActive: boolean;
  description?: string | null;
  branchCode?: string;
}

export interface UpdateKkdEntitlementMatrixRowDto extends Partial<CreateKkdEntitlementMatrixRowDto> {}

export interface KkdEntitlementOverrideDto extends BaseEntityDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeName?: string | null;
  matrixLineId?: number | null;
  groupCode: string;
  groupName?: string | null;
  extraQuantity: number;
  consumedQuantity: number;
  validFrom: string;
  validTo?: string | null;
  reason?: string | null;
  approvedByUserId?: number | null;
  isActive: boolean;
}

export interface CreateKkdEntitlementOverrideDto {
  employeeId: number;
  matrixLineId?: number | null;
  groupCode: string;
  groupName?: string | null;
  extraQuantity: number;
  validFrom: string;
  validTo?: string | null;
  reason?: string | null;
  approvedByUserId?: number | null;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdEntitlementOverrideDto extends Partial<CreateKkdEntitlementOverrideDto> {
  consumedQuantity?: number | null;
}

export interface KkdAdditionalEntitlementDto extends BaseEntityDto {
  customerId: number;
  employeeId: number;
  groupCode: string;
  groupName?: string | null;
  extraQuantity: number;
  consumedQuantity: number;
  validFrom: string;
  validTo?: string | null;
  description?: string | null;
  approvedByUserId?: number | null;
  isActive: boolean;
}

export interface CreateKkdAdditionalEntitlementDto {
  customerId: number;
  employeeId: number;
  groupCode: string;
  groupName?: string | null;
  extraQuantity: number;
  validFrom: string;
  validTo?: string | null;
  description?: string | null;
  approvedByUserId?: number | null;
  isActive: boolean;
  branchCode?: string;
}

export interface UpdateKkdAdditionalEntitlementDto extends Partial<CreateKkdAdditionalEntitlementDto> {
  consumedQuantity?: number | null;
}

export interface KkdEntitlementCheckRequestDto {
  employeeId: number;
  customerId?: number | null;
  groupCode: string;
  stockId?: number | null;
  quantity: number;
  transactionDate?: string | null;
}

export interface KkdEntitlementCheckResultDto {
  allowed: boolean;
  remainingMainQuantity: number;
  remainingAdditionalQuantity: number;
  totalRemainingQuantity: number;
  frequencyRuleSatisfied: boolean;
  message?: string | null;
  suggestedEntitlementType?: string | null;
  entitlementPolicyId?: number | null;
  additionalEntitlementId?: number | null;
  nextEligibleDate?: string | null;
}

export interface KkdDistributionHeaderDto extends BaseHeaderEntityDto {
  customerCode: string;
  employeeId: number;
  warehouseId: number;
  status: string;
  sourceChannel: string;
  lines: KkdDistributionLineDto[];
}

export interface KkdDistributionListItemDto extends BaseHeaderEntityDto {
  customerCode: string;
  employeeId: number;
  employeeCode?: string | null;
  employeeName?: string | null;
  warehouseId: number;
  status: string;
  sourceChannel: string;
  lineCount: number;
  totalQuantity: number;
}

export interface KkdDistributionLineDto extends BaseLineEntityDto {
  headerId: number;
  barcode?: string | null;
  groupCode?: string | null;
  groupName?: string | null;
  entitlementType: string;
  entitlementPolicyId?: number | null;
  additionalEntitlementId?: number | null;
  entitlementMatrixHeaderId?: number | null;
  entitlementMatrixLineId?: number | null;
  entitlementOverrideId?: number | null;
  warehouseId: number;
  shelfId?: number | null;
  stockTransactionRef?: string | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
}

export interface CreateKkdDistributionDraftDto {
  employeeId: number;
  customerId: number;
  customerCode: string;
  warehouseId: number;
  distributionDate?: string | null;
  description?: string | null;
  sourceChannel?: string;
  branchCode?: string;
}

export interface AddKkdDistributionLineDto {
  barcode?: string | null;
  stockId?: number | null;
  quantity: number;
  shelfId?: number | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
}

export interface UpdateKkdDistributionLineDto {
  quantity: number;
  shelfId?: number | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
}

export interface ResolveKkdStockBarcodeDto {
  barcode: string;
  warehouseId: number;
}

export interface KkdResolvedStockDto {
  stockId: number;
  stockCode: string;
  stockName: string;
  yapKodId?: number | null;
  yapKod?: string | null;
  groupCode?: string | null;
  groupName?: string | null;
  availableQuantity: number;
  warehouseId: number;
}

export interface KkdStockGroupOption {
  subeKodu: number;
  groupCode: string;
  groupName?: string | null;
}

export interface KkdRemainingEntitlementDto {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  customerId: number;
  customerCode: string;
  groupCode: string;
  groupName?: string | null;
  periodType?: string | null;
  remainingMainQuantity: number;
  remainingAdditionalQuantity: number;
  totalRemainingQuantity: number;
  frequencyRuleSatisfied: boolean;
  suggestedEntitlementType?: string | null;
  lastUsageDate?: string | null;
  nextEligibleDate?: string | null;
  message?: string | null;
}

export interface KkdValidationLogDto extends BaseEntityDto {
  customerId?: number | null;
  customerCode?: string | null;
  employeeId?: number | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  stockId?: number | null;
  stockCode?: string | null;
  stockName?: string | null;
  groupCode?: string | null;
  warehouseId?: number | null;
  scannedQr?: string | null;
  scannedBarcode?: string | null;
  attemptedQuantity: number;
  reasonCode: string;
  reasonMessage?: string | null;
  deviceInfo?: string | null;
}

export interface KkdDepartmentUsageReportDto {
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  totalQuantity: number;
  distributionCount: number;
  employeeCount: number;
  lastUsageDate?: string | null;
}

export interface KkdRoleUsageReportDto {
  roleId?: number | null;
  roleCode?: string | null;
  roleName?: string | null;
  totalQuantity: number;
  distributionCount: number;
  employeeCount: number;
  lastUsageDate?: string | null;
}

export interface KkdGroupUsageReportDto {
  groupCode: string;
  groupName?: string | null;
  totalQuantity: number;
  distributionCount: number;
  employeeCount: number;
  lastUsageDate?: string | null;
}
