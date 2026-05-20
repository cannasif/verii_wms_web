import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  ApiResponse,
  BilginogluHakEdisBatch,
  BilginogluHakEdisBatchStep,
  BilginogluHakEdisEvaluationResult,
  BilginogluHakEdisPlan,
  PagedParams,
  PagedResponse,
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
};
