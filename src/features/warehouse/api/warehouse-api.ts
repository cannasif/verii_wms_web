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
import { fetchAllPagedData } from '@/lib/fetch-all-paged-data';

function toLegacyCollectionResponse<T>(data: PagedResponse<T> | T[], message: string): ApiResponse<T[]> {
  return {
    success: true,
    message,
    exceptionMessage: '',
    data: Array.isArray(data) ? data : data.data,
    errors: [],
    timestamp: new Date().toISOString(),
    statusCode: 200,
    className: 'ApiResponse',
  };
}

async function getAllPagedData<T>(url: string, options: ApiRequestOptions | undefined, errorKey: string): Promise<T[]> {
  return fetchAllPagedData({
    fetchPage: async (pageNumber, pageSize) => {
      const response = await api.post<ApiResponse<PagedResponse<T>>>(url, buildPagedRequest({ pageNumber, pageSize, sortBy: 'Id', sortDirection: 'asc' }), options);
      if (response.success && response.data) return response.data;
      throw new Error(response.message || getLocalizedText(errorKey));
    },
  });
}

export const warehouseApi = {
  // RII_FN-backed source: inbound order headers are function reads and should not be represented as true server paging.
  getInboundOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WiFunction/headers/${customerCode}`, options);
  },

  // RII_FN-backed source: inbound item list remains function-based.
  getInboundOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<WarehouseOrderItemsResponse> => {
    return await api.get<WarehouseOrderItemsResponse>(`/api/WiFunction/lines/${orderNumbers}`, options);
  },

  // RII_FN-backed source: outbound order headers are function reads and should not be represented as true server paging.
  getOutboundOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<WarehouseOrdersResponse> => {
    return await api.get<WarehouseOrdersResponse>(`/api/WoFunction/headers/${customerCode}`, options);
  },

  // RII_FN-backed source: outbound item list remains function-based.
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

  getInboundHeaderById: async (id: number, options?: ApiRequestOptions): Promise<WarehouseHeader> => {
    const response = await api.get<ApiResponse<WarehouseHeader>>(`/api/WiHeader/${id}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseInboundHeaderDetailLoadFailed'));
  },

  updateInboundHeader: async (id: number, formData: WarehouseFormData): Promise<ApiResponse<WarehouseHeader>> => {
    return await api.put<ApiResponse<WarehouseHeader>>(`/api/WiHeader/${id}`, {
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      plannedDate: formData.transferDate,
      inboundType: formData.operationType || '',
      type: Number(formData.operationType || 0),
      projectCode: formData.projectCode || '',
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse || '',
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse || '',
      description1: formData.notes || '',
      description2: '',
      isPlanned: true,
      documentType: 'WI',
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder ?? false,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder ?? false,
    });
  },

  getOutboundHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WoHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundHeadersLoadFailed'));
  },

  getOutboundHeaderById: async (id: number, options?: ApiRequestOptions): Promise<WarehouseHeader> => {
    const response = await api.get<ApiResponse<WarehouseHeader>>(`/api/WoHeader/${id}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseOutboundHeadersLoadFailed'));
  },

  updateOutboundHeader: async (id: number, formData: WarehouseFormData): Promise<ApiResponse<WarehouseHeader>> => {
    return await api.put<ApiResponse<WarehouseHeader>>(`/api/WoHeader/${id}`, {
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      plannedDate: formData.transferDate,
      outboundType: formData.operationType || '',
      type: Number(formData.operationType || 0),
      projectCode: formData.projectCode || '',
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      sourceWarehouseId: formData.sourceWarehouseId,
      sourceWarehouse: formData.sourceWarehouse || '',
      targetWarehouseId: formData.targetWarehouseId,
      targetWarehouse: formData.targetWarehouse || '',
      description1: formData.notes || '',
      description2: '',
      isPlanned: true,
      documentType: 'WO',
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder ?? false,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder ?? false,
    });
  },

  getAssignedInboundHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<WarehouseHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      `/api/WiHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 1, sortBy: 'Id', sortDirection: 'desc' }),
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
      buildPagedRequest(params, { pageNumber: 1, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.warehouseAssignedOutboundHeadersLoadFailed'));
  },

  getInboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    const data = await getAllPagedData<WarehouseLine>(`/api/WiLine/header/${headerId}/paged`, options, 'common.errors.warehouseInboundLinesLoadFailed');
    return toLegacyCollectionResponse(data, 'Depo giriş satırları yüklendi');
  },

  getOutboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    const data = await getAllPagedData<WarehouseLine>(`/api/WoLine/header/${headerId}/paged`, options, 'common.errors.warehouseOutboundLinesLoadFailed');
    return toLegacyCollectionResponse(data, 'Depo çıkış satırları yüklendi');
  },

  getAssignedInboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WiHeader/assigned-lines/${headerId}`, options);
  },

  getAssignedOutboundLines: async (headerId: number, options?: ApiRequestOptions): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WoHeader/assigned-lines/${headerId}`, options);
  },

  getInboundLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<WarehouseLineSerialsResponse> => {
    const data = await getAllPagedData<WarehouseLineSerial>(`/api/WiLineSerial/line/${lineId}/paged`, options, 'common.errors.warehouseInboundSerialsLoadFailed');
    return toLegacyCollectionResponse(data, 'Depo giriş seri listesi yüklendi');
  },

  getOutboundLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<WarehouseLineSerialsResponse> => {
    const data = await getAllPagedData<WarehouseLineSerial>(`/api/WoLineSerial/line/${lineId}/paged`, options, 'common.errors.warehouseOutboundSerialsLoadFailed');
    return toLegacyCollectionResponse(data, 'Depo çıkış seri listesi yüklendi');
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

  deleteInboundHeader: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/WiHeader/${id}`);
  },

  deleteOutboundHeader: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/WoHeader/${id}`);
  },
};
