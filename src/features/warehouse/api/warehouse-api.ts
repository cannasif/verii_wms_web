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
} from '../types/warehouse';
import { buildWarehouseInboundRequest, buildWarehouseOutboundRequest } from '../utils/warehouse-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

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
    return await api.get<WarehouseHeadersResponse>('/api/WiHeader');
  },

  getOutboundHeaders: async (): Promise<WarehouseHeadersResponse> => {
    return await api.get<WarehouseHeadersResponse>('/api/WoHeader');
  },

  getInboundHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WiHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Depo giriş listesi yüklenemedi');
  },

  getOutboundHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>('/api/WoHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Depo çıkış listesi yüklenemedi');
  },

  getAssignedInboundHeaders: async (userId: number): Promise<WarehouseHeadersResponse> => {
    return await api.get<WarehouseHeadersResponse>(`/api/WiHeader/assigned/${userId}`);
  },

  getAssignedOutboundHeaders: async (userId: number): Promise<WarehouseHeadersResponse> => {
    return await api.get<WarehouseHeadersResponse>(`/api/WoHeader/assigned/${userId}`);
  },

  getInboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WiLine/header/${headerId}`);
  },

  getOutboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WoLine/header/${headerId}`);
  },

  getAssignedInboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WiHeader/assigned-lines/${headerId}`);
  },

  getAssignedOutboundLines: async (headerId: number): Promise<WarehouseLinesResponse> => {
    return await api.get<WarehouseLinesResponse>(`/api/WoHeader/assigned-lines/${headerId}`);
  },

  getInboundLineSerials: async (lineId: number): Promise<WarehouseLineSerialsResponse> => {
    return await api.get<WarehouseLineSerialsResponse>(`/api/WiLineSerial/line/${lineId}`);
  },

  getOutboundLineSerials: async (lineId: number): Promise<WarehouseLineSerialsResponse> => {
    return await api.get<WarehouseLineSerialsResponse>(`/api/WoLineSerial/line/${lineId}`);
  },

  getAwaitingApprovalWiHeaders: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WiHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen ambar giriş emirleri yüklenemedi');
  },

  getAwaitingApprovalWoHeaders: async (params: PagedParams = {}): Promise<PagedResponse<WarehouseHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<WarehouseHeader>>>(
      '/api/WoHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen ambar çıkış emirleri yüklenemedi');
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

