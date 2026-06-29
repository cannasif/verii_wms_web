import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { ApiRequestOptions } from '@/lib/request-utils';
import {
  normalizeKkdEmployee,
  normalizeKkdEmployeeDepartment,
  normalizeKkdEmployeeRole,
  normalizePagedResponse,
} from './kkd-mappers';
import type {
  AddKkdDistributionLineDto,
  CreateKkdDistributionDraftDto,
  CreateKkdDistributionSubmissionDto,
  CreateKkdEmployeeDepartmentDto,
  CreateKkdEmployeeDto,
  CreateKkdEmployeeRoleDto,
  CreateKkdEntitlementMatrixRowDto,
  CreateKkdEntitlementOverrideDto,
  CreateKkdEntitlementPolicyDto,
  KkdDistributionHeaderDto,
  KkdDistributionContextDto,
  KkdDistributionListItemDto,
  KkdDistributionLineDto,
  KkdDepartmentUsageReportDto,
  KkdEmployeeDepartmentDto,
  KkdEmployeeDto,
  KkdEmployeeRoleDto,
  KkdEntitlementCheckRequestDto,
  KkdEntitlementCheckResultDto,
  KkdEntitlementMatrixRowDto,
  KkdEntitlementOverrideDto,
  KkdEntitlementPolicyDto,
  KkdGroupUsageReportDto,
  KkdOrderContextDto,
  KkdOrderHeaderDto,
  KkdOrderStockOptionDto,
  KkdRemainingEntitlementDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
  KkdRoleUsageReportDto,
  KkdStockGroupOption,
  KkdValidationLogDto,
  CreateKkdOrderSubmissionDto,
  ResolveKkdEmployeeQrDto,
  ResolveKkdStockBarcodeDto,
  UpdateKkdDistributionLineDto,
  UpdateKkdEmployeeDepartmentDto,
  UpdateKkdEmployeeDto,
  UpdateKkdEmployeeRoleDto,
  UpdateKkdEntitlementMatrixRowDto,
  UpdateKkdEntitlementOverrideDto,
  UpdateKkdEntitlementPolicyDto,
} from '../types/kkd.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }
  return response.data;
}

function extractVoidResult(response: ApiResponse<boolean> | unknown): void {
  if (response == null || response === '') {
    return;
  }

  if (typeof response !== 'object') {
    return;
  }

  const envelope = response as ApiResponse<boolean>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.exceptionMessage || 'Request failed');
  }
}

function extractPaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  return extractData(response);
}

export const kkdApi = {
  getDepartments: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeDepartmentDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      '/api/KkdEmployeeDepartment/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'DepartmentCode', sortDirection: 'asc' }),
      options,
    );
    return normalizePagedResponse(extractData(response), normalizeKkdEmployeeDepartment);
  },
  createDepartment: async (dto: CreateKkdEmployeeDepartmentDto): Promise<KkdEmployeeDepartmentDto> => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>('/api/KkdEmployeeDepartment', dto);
    return normalizeKkdEmployeeDepartment(extractData(response));
  },
  updateDepartment: async (id: number, dto: UpdateKkdEmployeeDepartmentDto): Promise<KkdEmployeeDepartmentDto> => {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/KkdEmployeeDepartment/${id}`, dto);
    return normalizeKkdEmployeeDepartment(extractData(response));
  },
  deleteDepartment: async (id: number): Promise<void> => {
    if (!id) {
      throw new Error('Invalid department id');
    }
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployeeDepartment/${id}`);
    extractVoidResult(response);
  },

  getRoles: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeRoleDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      '/api/KkdEmployeeRole/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'RoleCode', sortDirection: 'asc' }),
      options,
    );
    return normalizePagedResponse(extractData(response), normalizeKkdEmployeeRole);
  },
  createRole: async (dto: CreateKkdEmployeeRoleDto): Promise<KkdEmployeeRoleDto> => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>('/api/KkdEmployeeRole', dto);
    return normalizeKkdEmployeeRole(extractData(response));
  },
  updateRole: async (id: number, dto: UpdateKkdEmployeeRoleDto): Promise<KkdEmployeeRoleDto> => {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/KkdEmployeeRole/${id}`, dto);
    return normalizeKkdEmployeeRole(extractData(response));
  },
  deleteRole: async (id: number): Promise<void> => {
    if (!id) {
      throw new Error('Invalid role id');
    }
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployeeRole/${id}`);
    extractVoidResult(response);
  },

  getEmployees: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      '/api/KkdEmployee/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'EmployeeCode', sortDirection: 'asc' }),
      options,
    );
    return normalizePagedResponse(extractData(response), normalizeKkdEmployee);
  },
  createEmployee: async (dto: CreateKkdEmployeeDto): Promise<KkdEmployeeDto> => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>('/api/KkdEmployee', dto);
    return normalizeKkdEmployee(extractData(response));
  },
  updateEmployee: async (id: number, dto: UpdateKkdEmployeeDto): Promise<KkdEmployeeDto> => {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/KkdEmployee/${id}`, dto);
    return normalizeKkdEmployee(extractData(response));
  },
  deleteEmployee: async (id: number): Promise<void> => {
    if (!id) {
      throw new Error('Invalid employee id');
    }
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployee/${id}`);
    extractVoidResult(response);
  },
  resolveEmployeeQr: async (dto: ResolveKkdEmployeeQrDto): Promise<KkdResolvedEmployeeDto> => {
    const response = await api.post<ApiResponse<KkdResolvedEmployeeDto>>('/api/KkdEmployee/qr-resolve', dto);
    return extractData(response);
  },

  getEntitlementMatrixRows: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementMatrixRowDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEntitlementMatrixRowDto>>>(
      '/api/KkdEntitlementMatrix/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  createEntitlementMatrixRow: async (dto: CreateKkdEntitlementMatrixRowDto): Promise<KkdEntitlementMatrixRowDto> => {
    const response = await api.post<ApiResponse<KkdEntitlementMatrixRowDto>>('/api/KkdEntitlementMatrix', dto);
    return extractData(response);
  },
  updateEntitlementMatrixRow: async (id: number, dto: UpdateKkdEntitlementMatrixRowDto): Promise<KkdEntitlementMatrixRowDto> => {
    const response = await api.put<ApiResponse<KkdEntitlementMatrixRowDto>>(`/api/KkdEntitlementMatrix/${id}`, dto);
    return extractData(response);
  },
  deleteEntitlementMatrixRow: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEntitlementMatrix/${id}`);
    extractVoidResult(response);
  },

  getEntitlementOverrides: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementOverrideDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEntitlementOverrideDto>>>(
      '/api/KkdEntitlementOverride/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  createEntitlementOverride: async (dto: CreateKkdEntitlementOverrideDto): Promise<KkdEntitlementOverrideDto> => {
    const response = await api.post<ApiResponse<KkdEntitlementOverrideDto>>('/api/KkdEntitlementOverride', dto);
    return extractData(response);
  },
  updateEntitlementOverride: async (id: number, dto: UpdateKkdEntitlementOverrideDto): Promise<KkdEntitlementOverrideDto> => {
    const response = await api.put<ApiResponse<KkdEntitlementOverrideDto>>(`/api/KkdEntitlementOverride/${id}`, dto);
    return extractData(response);
  },
  deleteEntitlementOverride: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEntitlementOverride/${id}`);
    extractVoidResult(response);
  },

  getAdditionalEntitlements: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementOverrideDto>> =>
    kkdApi.getEntitlementOverrides(params, options),
  createAdditionalEntitlement: async (dto: CreateKkdEntitlementOverrideDto): Promise<KkdEntitlementOverrideDto> =>
    kkdApi.createEntitlementOverride(dto),
  updateAdditionalEntitlement: async (id: number, dto: UpdateKkdEntitlementOverrideDto): Promise<KkdEntitlementOverrideDto> =>
    kkdApi.updateEntitlementOverride(id, dto),
  deleteAdditionalEntitlement: async (id: number): Promise<void> =>
    kkdApi.deleteEntitlementOverride(id),

  getEntitlementPolicies: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementPolicyDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEntitlementPolicyDto>>>(
      '/api/KkdEntitlementPolicy/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  createEntitlementPolicy: async (dto: CreateKkdEntitlementPolicyDto): Promise<KkdEntitlementPolicyDto> => {
    const response = await api.post<ApiResponse<KkdEntitlementPolicyDto>>('/api/KkdEntitlementPolicy', dto);
    return extractData(response);
  },
  updateEntitlementPolicy: async (id: number, dto: UpdateKkdEntitlementPolicyDto): Promise<KkdEntitlementPolicyDto> => {
    const response = await api.put<ApiResponse<KkdEntitlementPolicyDto>>(`/api/KkdEntitlementPolicy/${id}`, dto);
    return extractData(response);
  },
  deleteEntitlementPolicy: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEntitlementPolicy/${id}`);
    extractVoidResult(response);
  },

  getStockGroups: async (subeKodu?: string): Promise<KkdStockGroupOption[]> => {
    const response = await api.get<ApiResponse<Array<{ subeKodu: number; grupKod: string; grupIsim?: string | null }>>>(
      '/api/netsis-read/stock-groups',
      { params: { subeKodu } },
    );
    return extractData(response).map((row) => ({
      subeKodu: row.subeKodu,
      groupCode: row.grupKod,
      groupName: row.grupIsim,
    }));
  },
  getOrderContext: async (employeeId: number, transactionDate?: string | null): Promise<KkdOrderContextDto> => {
    const response = await api.get<ApiResponse<KkdOrderContextDto>>(`/api/KkdOrder/context/${employeeId}`, {
      params: { transactionDate: transactionDate || undefined },
    });
    return extractData(response);
  },
  getOrderStocksByGroup: async (groupCode: string, search?: string): Promise<KkdOrderStockOptionDto[]> => {
    const response = await api.get<ApiResponse<KkdOrderStockOptionDto[]>>(`/api/KkdOrder/stocks/by-group/${encodeURIComponent(groupCode)}`, {
      params: { search: search || undefined },
    });
    return extractData(response);
  },
  getOrderStocksByGroupPaged: async (groupCode: string, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdOrderStockOptionDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdOrderStockOptionDto>>>(
      `/api/KkdOrder/stocks/by-group/${encodeURIComponent(groupCode)}/paged`,
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'StockCode', sortDirection: 'asc' }),
      options,
    );
    return extractPaged(response);
  },
  submitOrder: async (dto: CreateKkdOrderSubmissionDto): Promise<KkdOrderHeaderDto> => {
    const response = await api.post<ApiResponse<KkdOrderHeaderDto>>('/api/KkdOrder/submit', dto);
    return extractData(response);
  },

  createDraft: async (dto: CreateKkdDistributionDraftDto): Promise<KkdDistributionHeaderDto> => {
    const response = await api.post<ApiResponse<KkdDistributionHeaderDto>>('/api/KkdDistribution/draft', dto);
    return extractData(response);
  },
  submitDistribution: async (dto: CreateKkdDistributionSubmissionDto): Promise<KkdDistributionHeaderDto> => {
    const response = await api.post<ApiResponse<KkdDistributionHeaderDto>>('/api/KkdDistribution/submit', dto);
    return extractData(response);
  },
  getDistributionContext: async (employeeId: number, transactionDate?: string | null): Promise<KkdDistributionContextDto> => {
    const response = await api.get<ApiResponse<KkdDistributionContextDto>>(`/api/KkdDistribution/context/${employeeId}`, {
      params: { transactionDate: transactionDate || undefined },
    });
    return extractData(response);
  },
  getDistributions: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdDistributionListItemDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdDistributionListItemDto>>>(
      '/api/KkdDistribution/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'DocumentDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getDistributionById: async (id: number): Promise<KkdDistributionHeaderDto> => {
    const response = await api.get<ApiResponse<KkdDistributionHeaderDto>>(`/api/KkdDistribution/${id}`);
    return extractData(response);
  },
  resolveStockBarcode: async (dto: ResolveKkdStockBarcodeDto): Promise<KkdResolvedStockDto> => {
    const response = await api.post<ApiResponse<KkdResolvedStockDto>>('/api/KkdDistribution/stock/barcode-resolve', dto);
    return extractData(response);
  },
  checkEntitlement: async (dto: KkdEntitlementCheckRequestDto): Promise<KkdEntitlementCheckResultDto> => {
    const response = await api.post<ApiResponse<KkdEntitlementCheckResultDto>>('/api/KkdDistribution/entitlement/check', dto);
    return extractData(response);
  },
  addDistributionLine: async (headerId: number, dto: AddKkdDistributionLineDto): Promise<KkdDistributionLineDto> => {
    const response = await api.post<ApiResponse<KkdDistributionLineDto>>(`/api/KkdDistribution/${headerId}/lines`, dto);
    return extractData(response);
  },
  updateDistributionLine: async (headerId: number, lineId: number, dto: UpdateKkdDistributionLineDto): Promise<KkdDistributionLineDto> => {
    const response = await api.put<ApiResponse<KkdDistributionLineDto>>(`/api/KkdDistribution/${headerId}/lines/${lineId}`, dto);
    return extractData(response);
  },
  deleteDistributionLine: async (headerId: number, lineId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdDistribution/${headerId}/lines/${lineId}`);
    extractVoidResult(response);
  },
  completeDistribution: async (headerId: number): Promise<void> => {
    const response = await api.post<ApiResponse<boolean>>(`/api/KkdDistribution/${headerId}/complete`);
    extractData(response);
  },
  cancelDistribution: async (headerId: number): Promise<void> => {
    const response = await api.post<ApiResponse<boolean>>(`/api/KkdDistribution/${headerId}/cancel`);
    extractData(response);
  },
  getRemainingEntitlements: async (employeeId: number, transactionDate?: string | null): Promise<KkdRemainingEntitlementDto[]> => {
    const response = await api.get<ApiResponse<KkdRemainingEntitlementDto[]>>('/api/KkdReport/remaining-entitlements', {
      params: {
        employeeId,
        transactionDate: transactionDate || undefined,
      },
    });
    return extractData(response);
  },
  getValidationLogs: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdValidationLogDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdValidationLogDto>>>(
      '/api/KkdReport/validation-logs/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'CreatedDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getDepartmentUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdDepartmentUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdDepartmentUsageReportDto>>>(
      '/api/KkdReport/department-usage/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getRoleUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdRoleUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdRoleUsageReportDto>>>(
      '/api/KkdReport/role-usage/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getGroupUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdGroupUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdGroupUsageReportDto>>>(
      '/api/KkdReport/group-usage/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
};
