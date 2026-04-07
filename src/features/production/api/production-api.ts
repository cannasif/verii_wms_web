import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateProductionPlanResponse,
  AddProductionOperationLineRequest,
  ProductionHeaderDetail,
  ProductionErpTemplateRequest,
  ProductionHeaderListItem,
  ProductionOperation,
  ProductionOperationEventRequest,
  ProductionPlanDraft,
  StartProductionOperationRequest,
  ProductionTemplateResponse,
} from '../types/production';

function toNullableDate(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeProductionDraftForApi(draft: ProductionPlanDraft): unknown {
  return {
    ...draft,
    header: {
      ...draft.header,
      documentDate: toNullableDate(draft.header.documentDate),
      plannedStartDate: toNullableDate(draft.header.plannedStartDate),
      plannedEndDate: toNullableDate(draft.header.plannedEndDate),
    },
  };
}

export const productionApi = {
  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<ProductionHeaderListItem>> => {
    const response = await api.post<ApiResponse<PagedResponse<ProductionHeaderListItem>>>(
      '/api/PrHeader/paged',
      buildPagedRequest(params),
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Uretim planlari yuklenemedi');
  },

  getAssignedHeaders: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<ProductionHeaderListItem>> => {
    const response = await api.post<ApiResponse<PagedResponse<ProductionHeaderListItem>>>(
      `/api/PrHeader/assigned/${userId}/paged`,
      buildPagedRequest(params),
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Atanmis uretim planlari yuklenemedi');
  },

  getAwaitingApprovalHeaders: async (params: PagedParams = {}): Promise<PagedResponse<ProductionHeaderListItem>> => {
    const response = await api.post<ApiResponse<PagedResponse<ProductionHeaderListItem>>>(
      '/api/PrHeader/completed-awaiting-erp-approval',
      buildPagedRequest(params),
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Onay bekleyen uretim planlari yuklenemedi');
  },

  approveProductionHeader: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/PrHeader/approval/${id}`, null, {
      params: { approved, id },
    });
  },

  getErpTemplate: async (request: ProductionErpTemplateRequest): Promise<ProductionPlanDraft> => {
    const response = await api.post<ProductionTemplateResponse>('/api/PrHeader/erp-template', request);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'ERP uretim taslagi alinamadi');
  },

  createProductionPlan: async (draft: ProductionPlanDraft): Promise<CreateProductionPlanResponse> => {
    return await api.post<CreateProductionPlanResponse>('/api/PrHeader/plan', normalizeProductionDraftForApi(draft));
  },

  updateProductionPlan: async (id: number, draft: ProductionPlanDraft): Promise<CreateProductionPlanResponse> => {
    return await api.put<CreateProductionPlanResponse>(`/api/PrHeader/plan/${id}`, normalizeProductionDraftForApi(draft));
  },

  softDeleteProductionPlan: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/PrHeader/${id}`);
  },

  getHeaderDetail: async (id: number): Promise<ProductionHeaderDetail> => {
    const response = await api.get<ApiResponse<ProductionHeaderDetail>>(`/api/PrHeader/detail/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Uretim plani detayi yuklenemedi');
  },

  startOperation: async (request: StartProductionOperationRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>('/api/PrOperation/start', request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Operasyon baslatilamadi');
  },

  pauseOperation: async (operationId: number, request: ProductionOperationEventRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>(`/api/PrOperation/${operationId}/pause`, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Operasyon duraklatilamadi');
  },

  resumeOperation: async (operationId: number, request: ProductionOperationEventRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>(`/api/PrOperation/${operationId}/resume`, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Operasyon devam ettirilemedi');
  },

  addConsumption: async (operationId: number, request: AddProductionOperationLineRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>(`/api/PrOperation/${operationId}/consumption`, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Tuketim kaydi olusturulamadi');
  },

  addOutput: async (operationId: number, request: AddProductionOperationLineRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>(`/api/PrOperation/${operationId}/output`, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Cikti kaydi olusturulamadi');
  },

  completeOperation: async (operationId: number, request: ProductionOperationEventRequest): Promise<ProductionOperation> => {
    const response = await api.post<ApiResponse<ProductionOperation>>(`/api/PrOperation/${operationId}/complete`, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Operasyon tamamlanamadi');
  },
};
