import { api } from '@/lib/axios';
import type {
  WarehouseOrdersResponse,
  WarehouseOrderItemsResponse,
  WarehouseFormData,
  SelectedWarehouseOrderItem,
  WarehouseHeadersResponse,
  WarehouseLinesResponse,
  WarehouseLineSerialsResponse,
  WarehouseHeader,
  WarehouseLine,
  WarehouseLineSerial,
} from '../types/warehouse';
import { buildWarehouseInboundRequest, buildWarehouseOutboundRequest } from '../utils/warehouse-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';

function toLegacyCollectionResponse<T>(data: PagedResponse<T>, message: string): ApiResponse<T[]> {
  return {
    success: true,
    message,
    exceptionMessage: '',
    data: data.data,
    errors: [],
    timestamp: new Date().toISOString(),
    statusCode: 200,
    className: 'ApiResponse',
  };
}

export const warehouseApi = {
  getInboundOrdersByCustomer: async (customerCode: string): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WiFunction/headers/${customerCode}`);
  },

  getInboundOrderItems: async (orderNumbers: string): Promise<WarehouseOrderItemsResponse> => {
    return await api.get<WarehouseOrderItemsResponse>(`/api/WiFunction/lines/${orderNumbers}`);
  },

  getOutboundOrdersByCustomer: async (customerCode: string): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WoFunction/headers/${customerCode}`);
  },

  getOutboundOrderItems: async (orderNumbers: string): Promise<WarehouseOrderItemsResponse> => {
    return await api.get<WarehouseOrderItemsResponse>(`/api/WoFunction/lines/${orderNumbers}`);
  },

  createWarehouseInbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseInboundRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WiHeader/generate', request);
  },

  createWarehouseOutbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseOutboundRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WoHeader/generate', request);
  },

  getInboundHeaders: async (): Promise<WarehouseHeadersResponse> => {
    const data = await warehouseApi.getInboundHeadersPaged();
    return toLegacyCollectionResponse(data, 'Depo giriş listesi yüklendi');
  },

  getOutboundHeaders: async (): Promise<WarehouseHeadersResponse> => {
    const data = await warehouseApi.getOutboundHeadersPaged();
    return toLegacyCollectionResponse(data, 'Depo çıkış listesi yüklendi');
  },

  getInboundHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WiHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundHeadersLoadFailed'));
  },

  getOutboundHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WoHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundHeadersLoadFailed'));
  },

  getAssignedInboundHeaders: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      `/api/WiHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseAssignedInboundHeadersLoadFailed'));
  },

  getAssignedOutboundHeaders: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      `/api/WoHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseAssignedOutboundHeadersLoadFailed'));
  },

  getInboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLine>>>(`/api/WiLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo giriş satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundLinesLoadFailed'));
  },

  getOutboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLine>>>(`/api/WoLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo çıkış satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundLinesLoadFailed'));
  },

  getAssignedInboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WiHeader/assigned-lines/${headerId}`);
  },

  getAssignedOutboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WoHeader/assigned-lines/${headerId}`);
  },

  getInboundLineSerials: async (lineId: number): Promise<WarehouseLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLineSerial>>>(`/api/WiLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo giriş seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundSerialsLoadFailed'));
  },

  getOutboundLineSerials: async (lineId: number): Promise<WarehouseLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLineSerial>>>(`/api/WoLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo çıkış seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundSerialsLoadFailed'));
  },

  getAwaitingApprovalWiHeaders: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WiHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundApprovalLoadFailed'));
  },

  getAwaitingApprovalWoHeaders: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WoHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundApprovalLoadFailed'));
  },

  approveWiHeader: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/WiHeader/approval/${id}`, null, {
      params: { approved },
    });
  },

  approveWoHeader: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/WoHeader/approval/${id}`, null, {
      params: { approved },
    });
  },
};
