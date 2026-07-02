import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { CreatePurchaseDocumentDto, PurchaseListRowDto } from '../types/purchase.types';

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
};
