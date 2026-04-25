import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { ApiRequestOptions } from '@/lib/request-utils';
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
  KkdRemainingEntitlementDto,
  KkdResolvedEmployeeDto,
  KkdResolvedStockDto,
  KkdRoleUsageReportDto,
  KkdStockGroupOption,
  KkdValidationLogDto,
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

function extractPaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  return extractData(response);
}

export const kkdApi = {
  getDepartments: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeDepartmentDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEmployeeDepartmentDto>>>(
      '/api/KkdEmployeeDepartment/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'DepartmentCode', sortDirection: 'asc' }),
      options,
    );
    return extractPaged(response);
  },
  createDepartment: async (dto: CreateKkdEmployeeDepartmentDto): Promise<KkdEmployeeDepartmentDto> => {
    const response = await api.post<ApiResponse<KkdEmployeeDepartmentDto>>('/api/KkdEmployeeDepartment', dto);
    return extractData(response);
  },
  updateDepartment: async (id: number, dto: UpdateKkdEmployeeDepartmentDto): Promise<KkdEmployeeDepartmentDto> => {
    const response = await api.put<ApiResponse<KkdEmployeeDepartmentDto>>(`/api/KkdEmployeeDepartment/${id}`, dto);
    return extractData(response);
  },
  deleteDepartment: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployeeDepartment/${id}`);
    extractData(response);
  },

  getRoles: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeRoleDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEmployeeRoleDto>>>(
      '/api/KkdEmployeeRole/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'RoleCode', sortDirection: 'asc' }),
      options,
    );
    return extractPaged(response);
  },
  createRole: async (dto: CreateKkdEmployeeRoleDto): Promise<KkdEmployeeRoleDto> => {
    const response = await api.post<ApiResponse<KkdEmployeeRoleDto>>('/api/KkdEmployeeRole', dto);
    return extractData(response);
  },
  updateRole: async (id: number, dto: UpdateKkdEmployeeRoleDto): Promise<KkdEmployeeRoleDto> => {
    const response = await api.put<ApiResponse<KkdEmployeeRoleDto>>(`/api/KkdEmployeeRole/${id}`, dto);
    return extractData(response);
  },
  deleteRole: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployeeRole/${id}`);
    extractData(response);
  },

  getEmployees: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEmployeeDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEmployeeDto>>>(
      '/api/KkdEmployee/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'EmployeeCode', sortDirection: 'asc' }),
      options,
    );
    return extractPaged(response);
  },
  createEmployee: async (dto: CreateKkdEmployeeDto): Promise<KkdEmployeeDto> => {
    const response = await api.post<ApiResponse<KkdEmployeeDto>>('/api/KkdEmployee', dto);
    return extractData(response);
  },
  updateEmployee: async (id: number, dto: UpdateKkdEmployeeDto): Promise<KkdEmployeeDto> => {
    const response = await api.put<ApiResponse<KkdEmployeeDto>>(`/api/KkdEmployee/${id}`, dto);
    return extractData(response);
  },
  deleteEmployee: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/KkdEmployee/${id}`);
    extractData(response);
  },
  resolveEmployeeQr: async (dto: ResolveKkdEmployeeQrDto): Promise<KkdResolvedEmployeeDto> => {
    const response = await api.post<ApiResponse<KkdResolvedEmployeeDto>>('/api/KkdEmployee/qr-resolve', dto);
    return extractData(response);
  },

  getEntitlementMatrixRows: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementMatrixRowDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEntitlementMatrixRowDto>>>(
      '/api/KkdEntitlementMatrix/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
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
    extractData(response);
  },

  getEntitlementOverrides: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdEntitlementOverrideDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdEntitlementOverrideDto>>>(
      '/api/KkdEntitlementOverride/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
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
    extractData(response);
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
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'UpdatedDate', sortDirection: 'desc' }),
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
    extractData(response);
  },

  getStockGroups: async (subeKodu?: string): Promise<KkdStockGroupOption[]> => {
    const response = await api.get<ApiResponse<Array<{ subeKodu: number; grupKod: string; grupIsim?: string | null }>>>(
      '/api/Erp/stock-groups',
      { params: { subeKodu } },
    );
    return extractData(response).map((row) => ({
      subeKodu: row.subeKodu,
      groupCode: row.grupKod,
      groupName: row.grupIsim,
    }));
  },

  createDraft: async (dto: CreateKkdDistributionDraftDto): Promise<KkdDistributionHeaderDto> => {
    const response = await api.post<ApiResponse<KkdDistributionHeaderDto>>('/api/KkdDistribution/draft', dto);
    return extractData(response);
  },
  submitDistribution: async (dto: CreateKkdDistributionSubmissionDto): Promise<KkdDistributionHeaderDto> => {
    const response = await api.post<ApiResponse<KkdDistributionHeaderDto>>('/api/KkdDistribution/submit', dto);
    return extractData(response);
  },
  getDistributions: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdDistributionListItemDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdDistributionListItemDto>>>(
      '/api/KkdDistribution/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'DocumentDate', sortDirection: 'desc' }),
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
    extractData(response);
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
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'CreatedDate', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getDepartmentUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdDepartmentUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdDepartmentUsageReportDto>>>(
      '/api/KkdReport/department-usage/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getRoleUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdRoleUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdRoleUsageReportDto>>>(
      '/api/KkdReport/role-usage/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
  getGroupUsageReports: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<KkdGroupUsageReportDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<KkdGroupUsageReportDto>>>(
      '/api/KkdReport/group-usage/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'TotalQuantity', sortDirection: 'desc' }),
      options,
    );
    return extractPaged(response);
  },
};
