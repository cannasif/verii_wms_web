import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateWmsDocumentSeriesDefinitionDto,
  CreateWmsDocumentSeriesRuleDto,
  ResolveWmsDocumentSeriesRequestDto,
  ResolveWmsDocumentSeriesResultDto,
  UpdateWmsDocumentSeriesDefinitionDto,
  UpdateWmsDocumentSeriesRuleDto,
  WmsDocumentSeriesDefinitionDto,
  WmsDocumentSeriesDefinitionPagedRowDto,
  WmsDocumentSeriesRuleDto,
  WmsDocumentSeriesRulePagedRowDto,
} from '../types/document-series-management.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || response.exceptionMessage || 'Request failed');
}

function normalizePaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  const data = response.data;
  return data ?? {
    data: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

export const documentSeriesManagementApi = {
  async getDefinitionsPaged(params: PagedParams = {}): Promise<PagedResponse<WmsDocumentSeriesDefinitionPagedRowDto>> {
    const response = await api.get<ApiResponse<PagedResponse<WmsDocumentSeriesDefinitionPagedRowDto>>>('/api/DocumentSeriesManagement/definitions/paged', {
      params: buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    });
    return normalizePaged(response);
  },

  async getDefinitionById(id: number): Promise<WmsDocumentSeriesDefinitionDto> {
    const response = await api.get<ApiResponse<WmsDocumentSeriesDefinitionDto>>(`/api/DocumentSeriesManagement/definitions/${id}`);
    return extractData(response);
  },

  async createDefinition(dto: CreateWmsDocumentSeriesDefinitionDto): Promise<WmsDocumentSeriesDefinitionDto> {
    const response = await api.post<ApiResponse<WmsDocumentSeriesDefinitionDto>>('/api/DocumentSeriesManagement/definitions', dto);
    return extractData(response);
  },

  async updateDefinition(id: number, dto: UpdateWmsDocumentSeriesDefinitionDto): Promise<WmsDocumentSeriesDefinitionDto> {
    const response = await api.put<ApiResponse<WmsDocumentSeriesDefinitionDto>>(`/api/DocumentSeriesManagement/definitions/${id}`, dto);
    return extractData(response);
  },

  async deleteDefinition(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/DocumentSeriesManagement/definitions/${id}`);
    return extractData(response);
  },

  async getRulesPaged(params: PagedParams = {}): Promise<PagedResponse<WmsDocumentSeriesRulePagedRowDto>> {
    const response = await api.get<ApiResponse<PagedResponse<WmsDocumentSeriesRulePagedRowDto>>>('/api/DocumentSeriesManagement/rules/paged', {
      params: buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    });
    return normalizePaged(response);
  },

  async getRuleById(id: number): Promise<WmsDocumentSeriesRuleDto> {
    const response = await api.get<ApiResponse<WmsDocumentSeriesRuleDto>>(`/api/DocumentSeriesManagement/rules/${id}`);
    return extractData(response);
  },

  async createRule(dto: CreateWmsDocumentSeriesRuleDto): Promise<WmsDocumentSeriesRuleDto> {
    const response = await api.post<ApiResponse<WmsDocumentSeriesRuleDto>>('/api/DocumentSeriesManagement/rules', dto);
    return extractData(response);
  },

  async updateRule(id: number, dto: UpdateWmsDocumentSeriesRuleDto): Promise<WmsDocumentSeriesRuleDto> {
    const response = await api.put<ApiResponse<WmsDocumentSeriesRuleDto>>(`/api/DocumentSeriesManagement/rules/${id}`, dto);
    return extractData(response);
  },

  async deleteRule(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/DocumentSeriesManagement/rules/${id}`);
    return extractData(response);
  },

  async resolve(dto: ResolveWmsDocumentSeriesRequestDto): Promise<ResolveWmsDocumentSeriesResultDto> {
    const response = await api.post<ApiResponse<ResolveWmsDocumentSeriesResultDto>>('/api/DocumentSeriesManagement/resolve', dto);
    return extractData(response);
  },
};
