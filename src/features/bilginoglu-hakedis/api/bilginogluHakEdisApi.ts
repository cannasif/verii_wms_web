import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  ApiResponse,
  BilginogluHakEdisBatch,
  BilginogluHakEdisBatchStep,
  BilginogluHakEdisEvaluationResult,
  BilginogluHakEdisBulkOperationResult,
  BilginogluHakEdisOrderActivity,
  BilginogluHakEdisOrderHeader,
  BilginogluHakEdisPendingOperation,
  BilginogluHakEdisPlan,
  BilginogluHakEdisCompletedLocationSetting,
  BilginogluHakEdisOperationSetting,
  BilginogluHakEdisCreateTransfersResult,
  BilginogluHakEdisMoveAllocationRequest,
  BilginogluHakEdisMoveAllocationResult,
  BilginogluHakEdisMoveTarget,
  BilginogluHakEdisTransferPreview,
  BilginogluHakEdisOrderSummaryReport,
  PagedParams,
  PagedResponse,
  UpsertBilginogluHakEdisCompletedLocationSetting,
  UpsertBilginogluHakEdisOperationSetting,
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
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'OrderDate', sortDirection: 'asc' }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisOrderHeader>>));
  },

  getOrderSummaryReport: async (params: PagedParams): Promise<PagedResponse<BilginogluHakEdisOrderSummaryReport>> => {
    const response = await api.post<ApiResponse<PagedResponse<BilginogluHakEdisOrderSummaryReport>>>(
      '/api/BilginogluHakEdis/reports/order-summary/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'OrderDate', sortDirection: 'asc' }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisOrderSummaryReport>>));
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

  getCompletedLocationSettings: async (): Promise<BilginogluHakEdisCompletedLocationSetting[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisCompletedLocationSetting[]>>('/api/BilginogluHakEdis/completed-location-settings');
    return extractData(response as ApiResponse<BilginogluHakEdisCompletedLocationSetting[]>);
  },

  createCompletedLocationSetting: async (
    input: UpsertBilginogluHakEdisCompletedLocationSetting,
  ): Promise<BilginogluHakEdisCompletedLocationSetting> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisCompletedLocationSetting>>('/api/BilginogluHakEdis/completed-location-settings', input);
    return extractData(response as ApiResponse<BilginogluHakEdisCompletedLocationSetting>);
  },

  updateCompletedLocationSetting: async (
    id: number,
    input: UpsertBilginogluHakEdisCompletedLocationSetting,
  ): Promise<BilginogluHakEdisCompletedLocationSetting> => {
    const response = await api.put<ApiResponse<BilginogluHakEdisCompletedLocationSetting>>(`/api/BilginogluHakEdis/completed-location-settings/${id}`, input);
    return extractData(response as ApiResponse<BilginogluHakEdisCompletedLocationSetting>);
  },

  deleteCompletedLocationSetting: async (id: number): Promise<boolean> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/BilginogluHakEdis/completed-location-settings/${id}`);
    return extractData(response as ApiResponse<boolean>);
  },

  getOperationSettings: async (): Promise<BilginogluHakEdisOperationSetting[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisOperationSetting[]>>('/api/BilginogluHakEdis/operation-settings');
    return extractData(response as ApiResponse<BilginogluHakEdisOperationSetting[]>);
  },

  createOperationSetting: async (
    input: UpsertBilginogluHakEdisOperationSetting,
  ): Promise<BilginogluHakEdisOperationSetting> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisOperationSetting>>('/api/BilginogluHakEdis/operation-settings', input);
    return extractData(response as ApiResponse<BilginogluHakEdisOperationSetting>);
  },

  updateOperationSetting: async (
    id: number,
    input: UpsertBilginogluHakEdisOperationSetting,
  ): Promise<BilginogluHakEdisOperationSetting> => {
    const response = await api.put<ApiResponse<BilginogluHakEdisOperationSetting>>(`/api/BilginogluHakEdis/operation-settings/${id}`, input);
    return extractData(response as ApiResponse<BilginogluHakEdisOperationSetting>);
  },

  deleteOperationSetting: async (id: number): Promise<boolean> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/BilginogluHakEdis/operation-settings/${id}`);
    return extractData(response as ApiResponse<boolean>);
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

  getMoveTargets: async (batchId: number): Promise<BilginogluHakEdisMoveTarget[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisMoveTarget[]>>(`/api/BilginogluHakEdis/batches/${batchId}/move-targets`);
    return extractData(response as ApiResponse<BilginogluHakEdisMoveTarget[]>);
  },

  moveShipmentAllocation: async (
    batchId: number,
    input: BilginogluHakEdisMoveAllocationRequest,
  ): Promise<BilginogluHakEdisMoveAllocationResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisMoveAllocationResult>>(
      `/api/BilginogluHakEdis/batches/${batchId}/move-shipment-allocation`,
      input,
    );
    return extractData(response as ApiResponse<BilginogluHakEdisMoveAllocationResult>);
  },

  getPendingHakEdisTransfers: async (params: PagedParams): Promise<PagedResponse<BilginogluHakEdisPendingOperation>> => {
    const response = await api.post<ApiResponse<PagedResponse<BilginogluHakEdisPendingOperation>>>(
      '/api/BilginogluHakEdis/batches/pending-hakedis-transfers/paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'UpdatedDate',
        sortDirection: 'desc',
      }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisPendingOperation>>));
  },

  getPendingShipmentOrders: async (params: PagedParams): Promise<PagedResponse<BilginogluHakEdisPendingOperation>> => {
    const response = await api.post<ApiResponse<PagedResponse<BilginogluHakEdisPendingOperation>>>(
      '/api/BilginogluHakEdis/batches/pending-shipments/paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'UpdatedDate',
        sortDirection: 'desc',
      }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<BilginogluHakEdisPendingOperation>>));
  },

  evaluate: async (siparisNo?: string): Promise<BilginogluHakEdisEvaluationResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisEvaluationResult>>('/api/BilginogluHakEdis/evaluate', {
      siparisNo: siparisNo?.trim() || null,
      createPlannedBatches: false,
    });
    return extractData(response as ApiResponse<BilginogluHakEdisEvaluationResult>);
  },

  getTransferPreview: async (orderHeaderId: number): Promise<BilginogluHakEdisTransferPreview> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisTransferPreview>>(`/api/BilginogluHakEdis/orders/${orderHeaderId}/transfer-preview`);
    return extractData(response as ApiResponse<BilginogluHakEdisTransferPreview>);
  },

  getBulkTransferPreview: async (): Promise<BilginogluHakEdisTransferPreview[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisTransferPreview[]>>('/api/BilginogluHakEdis/orders/hakedis-transfer-preview');
    return extractData(response as ApiResponse<BilginogluHakEdisTransferPreview[]>);
  },

  getBulkShipmentPreview: async (): Promise<BilginogluHakEdisTransferPreview[]> => {
    const response = await api.get<ApiResponse<BilginogluHakEdisTransferPreview[]>>('/api/BilginogluHakEdis/orders/shipment-preview');
    return extractData(response as ApiResponse<BilginogluHakEdisTransferPreview[]>);
  },

  createSuggestedTransfers: async (orderHeaderId: number): Promise<BilginogluHakEdisCreateTransfersResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisCreateTransfersResult>>(`/api/BilginogluHakEdis/orders/${orderHeaderId}/create-suggested-transfers`, {});
    return extractData(response as ApiResponse<BilginogluHakEdisCreateTransfersResult>);
  },

  createHakEdisTransferOrders: async (): Promise<BilginogluHakEdisBulkOperationResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisBulkOperationResult>>('/api/BilginogluHakEdis/orders/create-hakedis-transfer-orders', {});
    return extractData(response as ApiResponse<BilginogluHakEdisBulkOperationResult>);
  },

  createShipmentOrders: async (): Promise<BilginogluHakEdisBulkOperationResult> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisBulkOperationResult>>('/api/BilginogluHakEdis/orders/create-shipment-orders', {});
    return extractData(response as ApiResponse<BilginogluHakEdisBulkOperationResult>);
  },

  runBatchAction: async (batchId: number, action: string): Promise<BilginogluHakEdisBatch> => {
    const response = await api.post<ApiResponse<BilginogluHakEdisBatch>>(`/api/BilginogluHakEdis/batches/${batchId}/${action}`, {});
    return extractData(response as ApiResponse<BilginogluHakEdisBatch>);
  },
};
