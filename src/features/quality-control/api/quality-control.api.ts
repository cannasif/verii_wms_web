import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  CreateInventoryQualityInspectionDto,
  CreateInventoryQualityParameterDto,
  CreateInventoryQualityRuleDto,
  InventoryQualityInspectionDto,
  InventoryQualityInspectionPagedRowDto,
  InventoryQualityParameterDto,
  InventoryQualityQuarantineDecisionDto,
  InventoryQualityQuarantinePagedRowDto,
  InventoryQualityResolvedPolicyDto,
  InventoryQualityRuleDto,
  InventoryQualityRulePagedRowDto,
  UpdateInventoryQualityInspectionDto,
  UpdateInventoryQualityRuleDto,
} from '../types/quality-control.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || response.exceptionMessage || getLocalizedText('common.errors.unknown'));
}

export const qualityControlApi = {
  async createRule(dto: CreateInventoryQualityRuleDto): Promise<InventoryQualityRuleDto> {
    const response = await api.post<ApiResponse<InventoryQualityRuleDto>>('/api/QualityControl/rules', dto);
    return extractData(response);
  },

  async updateRule(id: number, dto: UpdateInventoryQualityRuleDto): Promise<InventoryQualityRuleDto> {
    const response = await api.put<ApiResponse<InventoryQualityRuleDto>>(`/api/QualityControl/rules/${id}`, dto);
    return extractData(response);
  },

  async getRuleById(id: number): Promise<InventoryQualityRuleDto> {
    const response = await api.get<ApiResponse<InventoryQualityRuleDto>>(`/api/QualityControl/rules/${id}`);
    return extractData(response);
  },

  async getRulesPaged(params: PagedParams = {}): Promise<PagedResponse<InventoryQualityRulePagedRowDto>> {
    const response = await api.post<ApiResponse<PagedResponse<InventoryQualityRulePagedRowDto>>>(
      '/api/QualityControl/rules/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return extractData(response);
  },

  async removeRule(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/QualityControl/rules/${id}`);
    return extractData(response);
  },

  async getParameter(branchCode = '0'): Promise<InventoryQualityParameterDto> {
    const response = await api.get<ApiResponse<InventoryQualityParameterDto>>('/api/QualityControl/parameters', {
      params: { branchCode },
    });
    return extractData(response);
  },

  async saveParameter(dto: CreateInventoryQualityParameterDto): Promise<InventoryQualityParameterDto> {
    const response = await api.post<ApiResponse<InventoryQualityParameterDto>>('/api/QualityControl/parameters', dto);
    return extractData(response);
  },

  async resolvePolicy(params: { stockId?: number | null; stockGroupCode?: string | null; branchCode?: string | null }): Promise<InventoryQualityResolvedPolicyDto> {
    const response = await api.get<ApiResponse<InventoryQualityResolvedPolicyDto>>('/api/QualityControl/resolve-policy', {
      params,
    });
    return extractData(response);
  },

  async createInspection(dto: CreateInventoryQualityInspectionDto): Promise<InventoryQualityInspectionDto> {
    const response = await api.post<ApiResponse<InventoryQualityInspectionDto>>('/api/QualityControl/inspections', dto);
    return extractData(response);
  },

  async updateInspection(id: number, dto: UpdateInventoryQualityInspectionDto): Promise<InventoryQualityInspectionDto> {
    const response = await api.put<ApiResponse<InventoryQualityInspectionDto>>(`/api/QualityControl/inspections/${id}`, dto);
    return extractData(response);
  },

  async getInspectionById(id: number): Promise<InventoryQualityInspectionDto> {
    const response = await api.get<ApiResponse<InventoryQualityInspectionDto>>(`/api/QualityControl/inspections/${id}`);
    return extractData(response);
  },

  async getInspectionsPaged(params: PagedParams = {}): Promise<PagedResponse<InventoryQualityInspectionPagedRowDto>> {
    const response = await api.post<ApiResponse<PagedResponse<InventoryQualityInspectionPagedRowDto>>>(
      '/api/QualityControl/inspections/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return extractData(response);
  },

  async getQuarantinePaged(params: PagedParams = {}): Promise<PagedResponse<InventoryQualityQuarantinePagedRowDto>> {
    const response = await api.post<ApiResponse<PagedResponse<InventoryQualityQuarantinePagedRowDto>>>(
      '/api/QualityControl/quarantine/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return extractData(response);
  },

  async applyQuarantineDecision(id: number, dto: InventoryQualityQuarantineDecisionDto): Promise<InventoryQualityInspectionDto> {
    const response = await api.post<ApiResponse<InventoryQualityInspectionDto>>(`/api/QualityControl/quarantine/${id}/decision`, dto);
    return extractData(response);
  },

  async removeInspection(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/QualityControl/inspections/${id}`);
    return extractData(response);
  },
};
