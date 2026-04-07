import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateProductionTransferResponse,
  ProductionTransferDetail,
  ProductionTransferDraft,
  ProductionTransferListItem,
  ProductionTransferSuggestedLine,
  ProductionTransferSuggestionRequest,
} from '../types/production-transfer';

function toNullableDate(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeProductionTransferDraftForApi(draft: ProductionTransferDraft): unknown {
  return {
    ...draft,
    documentDate: toNullableDate(draft.documentDate),
  };
}

export const productionTransferApi = {
  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<ProductionTransferListItem>> => {
    const response = await api.post<ApiResponse<PagedResponse<ProductionTransferListItem>>>(
      '/api/PtHeader/paged',
      buildPagedRequest(params),
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Uretim transfer emirleri yuklenemedi');
  },

  getAwaitingApprovalHeaders: async (params: PagedParams = {}): Promise<PagedResponse<ProductionTransferListItem>> => {
    const response = await api.post<ApiResponse<PagedResponse<ProductionTransferListItem>>>(
      '/api/PtHeader/completed-awaiting-erp-approval',
      buildPagedRequest(params),
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Onay bekleyen uretim transfer emirleri yuklenemedi');
  },

  approveProductionTransfer: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/PtHeader/approval/${id}`, null, {
      params: { approved, id },
    });
  },

  createProductionTransfer: async (draft: ProductionTransferDraft): Promise<CreateProductionTransferResponse> => {
    return await api.post<CreateProductionTransferResponse>('/api/PtHeader/production-transfer', normalizeProductionTransferDraftForApi(draft));
  },

  updateProductionTransfer: async (id: number, draft: ProductionTransferDraft): Promise<CreateProductionTransferResponse> => {
    return await api.put<CreateProductionTransferResponse>(`/api/PtHeader/production-transfer/${id}`, normalizeProductionTransferDraftForApi(draft));
  },

  softDeleteProductionTransfer: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/PtHeader/${id}`);
  },

  getSuggestedLines: async (request: ProductionTransferSuggestionRequest): Promise<ProductionTransferSuggestedLine[]> => {
    const response = await api.post<ApiResponse<ProductionTransferSuggestedLine[]>>('/api/PtHeader/production-transfer-suggestions', request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Uretim transfer onerileri alinamadi');
  },

  getProductionTransferDetail: async (id: number): Promise<ProductionTransferDetail> => {
    const response = await api.get<ApiResponse<ProductionTransferDetail>>(`/api/PtHeader/production-transfer/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Uretim transfer detayi yuklenemedi');
  },
};
