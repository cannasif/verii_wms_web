import { api } from '@/lib/axios';
import type {
  WarehouseOrdersResponse,
  WarehouseOrderItemsResponse,
  WarehouseFormData,
  SelectedWarehouseOrderItem,
  SelectedWarehouseStockItem,
  WarehouseHeadersResponse,
  WarehouseLinesResponse,
  WarehouseLineSerialsResponse,
  WarehouseHeader,
  WarehouseLine,
  WarehouseLineSerial,
} from '../types/warehouse';
import {
  buildWarehouseInboundProcessRequest,
  buildWarehouseInboundRequest,
  buildWarehouseOutboundProcessRequest,
  buildWarehouseOutboundRequest,
} from '../utils/warehouse-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type { ApiRequestOptions } from '@/lib/request-utils';

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
  getInboundOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WiFunction/headers/${customerCode}`, options);
  },

  getInboundOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<WarehouseOrderItemsResponse> => {
    return await api.get<WarehouseOrderItemsResponse>(`/api/WiFunction/lines/${orderNumbers}`, options);
  },

  getOutboundOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WoFunction/headers/${customerCode}`, options);
  },

  getOutboundOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<WarehouseOrderItemsResponse> => {
    return await api.get<WarehouseOrderItemsResponse>(`/api/WoFunction/lines/${orderNumbers}`, options);
  },

  createWarehouseInbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseInboundRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WiHeader/generate', request);
  },

  createStockBasedWarehouseInbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseInboundRequest(formData, selectedItems, true);
    return await api.post<ApiResponse<unknown>>('/api/WiHeader/generate', request);
  },

  processWarehouseInbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseInboundProcessRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WiHeader/process', request);
  },

  createWarehouseOutbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseOutboundRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WoHeader/generate', request);
  },

  createStockBasedWarehouseOutbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseOutboundRequest(formData, selectedItems, true);
    return await api.post<ApiResponse<unknown>>('/api/WoHeader/generate', request);
  },

  processWarehouseOutbound: async (
    formData: WarehouseFormData,
    selectedItems: SelectedWarehouseStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildWarehouseOutboundProcessRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/WoHeader/process', request);
  },

  getInboundHeaders: async (options?: ApiRequestOptions): Promise<WarehouseHeadersResponse> => {
    const data = await warehouseApi.getInboundHeadersPaged({}, options);
    return toLegacyCollectionResponse(data, 'Depo giriş listesi yüklendi');
  },

  getOutboundHeaders: async (options?: ApiRequestOptions): Promise<WarehouseHeadersResponse> => {
    const data = await warehouseApi.getOutboundHeadersPaged({}, options);
    return toLegacyCollectionResponse(data, 'Depo çıkış listesi yüklendi');
  },

  getInboundHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WiHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundHeadersLoadFailed'));
  },

  getOutboundHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WoHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundHeadersLoadFailed'));
  },

  getAssignedInboundHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      `/api/WiHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseAssignedInboundHeadersLoadFailed'));
  },

  getAssignedOutboundHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      `/api/WoHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseAssignedOutboundHeadersLoadFailed'));
  },

  getInboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLine>>>(`/api/WiLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo giriş satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundLinesLoadFailed'));
  },

  getOutboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLine>>>(`/api/WoLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo çıkış satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundLinesLoadFailed'));
  },

  getAssignedInboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WiHeader/assigned-lines/${headerId}`, options);
  },

  getAssignedOutboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WoHeader/assigned-lines/${headerId}`, options);
  },

  getInboundLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<WarehouseLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLineSerial>>>(`/api/WiLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo giriş seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundSerialsLoadFailed'));
  },

  getOutboundLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<WarehouseLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseLineSerial>>>(`/api/WoLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Depo çıkış seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundSerialsLoadFailed'));
  },

  getAwaitingApprovalWiHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WiHeader/completed-awaiting-erp-approval',
      requestBody,
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundApprovalLoadFailed'));
  },

  getAwaitingApprovalWoHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WoHeader/completed-awaiting-erp-approval',
      requestBody,
      options,
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
