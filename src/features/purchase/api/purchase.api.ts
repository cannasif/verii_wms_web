import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { CreatePurchaseApprovalRuleDto, CreatePurchaseDocumentDto, PurchaseApprovalRuleDto, PurchaseDefinitionDto, PurchaseListRowDto } from '../types/purchase.types';

export type PurchaseEndpoint = 'PurchaseRequest' | 'PurchaseRfq' | 'SupplierQuotation' | 'PurchaseOrder';

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || response.exceptionMessage || 'Request failed');
}

function normalizePaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  return response.data ?? {
    data: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

export const purchaseApi = {
  async getPaged(endpoint: PurchaseEndpoint, params: PagedParams = {}): Promise<PagedResponse<PurchaseListRowDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PurchaseListRowDto>>>(
      `/api/${endpoint}/paged`,
      buildPagedRequest(params, { pageNumber: 1, pageSize: 10, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async create(endpoint: PurchaseEndpoint, dto: CreatePurchaseDocumentDto): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/api/${endpoint}`, dto);
    return extractData(response);
  },

  async getById(endpoint: PurchaseEndpoint, id: number): Promise<CreatePurchaseDocumentDto & Record<string, unknown>> {
    const response = await api.get<ApiResponse<CreatePurchaseDocumentDto & Record<string, unknown>>>(`/api/${endpoint}/${id}`);
    return extractData(response);
  },

  async update(endpoint: PurchaseEndpoint, id: number, dto: CreatePurchaseDocumentDto): Promise<unknown> {
    const response = await api.put<ApiResponse<unknown>>(`/api/${endpoint}/${id}`, dto);
    return extractData(response);
  },

  async convertSupplierQuotationToOrder(id: number, dto: { orderNo?: string | null; orderDate?: string | null; deliveryDate?: string | null } = {}): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/api/SupplierQuotation/${id}/convert-to-order`, dto);
    return extractData(response);
  },

  async submitApproval(endpoint: Extract<PurchaseEndpoint, 'SupplierQuotation' | 'PurchaseOrder'>, id: number, reason?: string): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/api/${endpoint}/${id}/submit-approval`, { reason: reason || null });
    return extractData(response);
  },

  async approve(endpoint: Extract<PurchaseEndpoint, 'SupplierQuotation' | 'PurchaseOrder'>, id: number, reason?: string): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/api/${endpoint}/${id}/approve`, { reason: reason || null });
    return extractData(response);
  },

  async reject(endpoint: Extract<PurchaseEndpoint, 'SupplierQuotation' | 'PurchaseOrder'>, id: number, reason?: string): Promise<unknown> {
    const response = await api.post<ApiResponse<unknown>>(`/api/${endpoint}/${id}/reject`, { reason: reason || null });
    return extractData(response);
  },
};

export const purchaseApprovalRuleApi = {
  async getPaged(params: PagedParams = {}): Promise<PagedResponse<PurchaseApprovalRuleDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PurchaseApprovalRuleDto>>>(
      '/api/PurchaseApprovalRule/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 10, sortBy: 'Id', sortDirection: 'desc' }),
    );
    return normalizePaged(response);
  },

  async getById(id: number): Promise<PurchaseApprovalRuleDto> {
    const response = await api.get<ApiResponse<PurchaseApprovalRuleDto>>(`/api/PurchaseApprovalRule/${id}`);
    return extractData(response);
  },

  async create(dto: CreatePurchaseApprovalRuleDto): Promise<PurchaseApprovalRuleDto> {
    const response = await api.post<ApiResponse<PurchaseApprovalRuleDto>>('/api/PurchaseApprovalRule', dto);
    return extractData(response);
  },

  async update(id: number, dto: CreatePurchaseApprovalRuleDto): Promise<PurchaseApprovalRuleDto> {
    const response = await api.put<ApiResponse<PurchaseApprovalRuleDto>>(`/api/PurchaseApprovalRule/${id}`, dto);
    return extractData(response);
  },

  async delete(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/PurchaseApprovalRule/${id}`);
    return extractData(response);
  },
};

export const purchaseDefinitionApi = {
  async getActiveByCategory(category: PurchaseDefinitionDto['category'], options?: { signal?: AbortSignal }): Promise<PurchaseDefinitionDto[]> {
    const response = await api.get<ApiResponse<PurchaseDefinitionDto[]>>(`/api/PurchaseDefinition/active/${category}`, { signal: options?.signal });
    return extractData(response);
  },

  async getPaged(params: PagedParams = {}): Promise<PagedResponse<PurchaseDefinitionDto>> {
    const response = await api.post<ApiResponse<PagedResponse<PurchaseDefinitionDto>>>(
      '/api/PurchaseDefinition/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'SortOrder', sortDirection: 'asc' }),
    );
    return normalizePaged(response);
  },
};
