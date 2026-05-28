import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  ApiResponse,
  BilginogluHakEdisBatch,
  BilginogluHakEdisBatchStep,
  BilginogluHakEdisEvaluationResult,
  BilginogluHakEdisOrderActivity,
  BilginogluHakEdisOrderHeader,
  BilginogluHakEdisPlan,
  PagedParams,
  PagedResponse,
  UpdateBilginogluHakEdisOrderPolicy,
} from '../types/bilginoglu-hakedis.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || response.exceptionMessage || getLocalizedText('common.errors.requestFailed'));
  }
  return response.data;
}

function normalizePaged<T>(response: PagedResponse<T>): PagedResponse<T> {
  const raw = response as PagedResponse<T> & { items?: T[] };
  return raw.items && !raw.data ? { ...response, data: raw.items } : response;
}

export const bilginogluHakEdisApi = {
  getOrders: async (params: PagedParams): Promise<PagedResponse<BilginogluHakEdisOrderHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<BilginogluHakEdisOrderHeader>>>(
      '/api/BilginogluHakEdis/orders/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'LastEvaluationDate', sortDirection: 'desc' }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisOrderHeader>>));
  },

  getOrderPlans: async (orderHeaderId: number): Promise<BilginogluHakEdisPlan[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisPlan[]>>(`/api/BilginogluHakEdis/orders/${orderHeaderId}/plans`);
    return extractData(response as ApiResponse<BilginogluHakEdisPlan[]>);
  },

  getOrderActivities: async (orderHeaderId: number): Promise<BilginogluHakEdisOrderActivity[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisOrderActivity[]>>(`/api/BilginogluHakEdis/orders/${orderHeaderId}/activities`);
    return extractData(response as ApiResponse<BilginogluHakEdisOrderActivity[]>);
  },

  updateOrderPolicy: async (orderHeaderId: number, input: UpdateBilginogluHakEdisOrderPolicy): Promise<BilginogluHakEdisOrderHeader> => {
    const response = await api.put<ApiResponse<BilginogluHakEdisOrderHeader>>(`/api/BilginogluHakEdis/orders/${orderHeaderId}/policies`, input);
    return extractData(response as ApiResponse<BilginogluHakEdisOrderHeader>);
  },

  getPlans: async (params: PagedParams): Promise<PagedResponse<BilginogluHakEdisPlan>> => {
    const response = await api.post<ApiResponse<PagedResponse<BilginogluHakEdisPlan>>>(
      '/api/BilginogluHakEdis/plans/paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'LastEvaluationDate',
        sortDirection: 'desc',
      }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisPlan>>));
  },

  getBatches: async (planId: number): Promise<BilginogluHakEdisBatch[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisBatch[]>>(`/api/BilginogluHakEdis/plans/${planId}/batches`);
    return extractData(response as ApiResponse<BilginogluHakEdisBatch[]>);
  },

  getSteps: async (batchId: number): Promise<BilginogluHakEdisBatchStep[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisBatchStep[]>>(`/api/BilginogluHakEdis/batches/${batchId}/steps`);
    return extractData(response as ApiResponse<BilginogluHakEdisBatchStep[]>);
  },

  evaluate: async (siparisNo?: string): Promise<BilginogluHakEdisEvaluationResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisEvaluationResult>>('/api/BilginogluHakEdis/evaluate', {
      siparisNo: siparisNo?.trim() || null,
      createPlannedBatches: true,
    });
    return extractData(response as ApiResponse<BilginogluHakEdisEvaluationResult>);
  },

  runBatchAction: async (batchId: number, action: string): Promise<BilginogluHakEdisBatch> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisBatch>>(`/api/BilginogluHakEdis/batches/${batchId}/${action}`, {});
    return extractData(response as ApiResponse<BilginogluHakEdisBatch>);
  },
};
