import { api } from '@/lib/axios';
import type {
  ShipmentOrdersResponse,
  ShipmentOrderItemsResponse,
  ShipmentFormData,
  SelectedShipmentOrderItem,
  SelectedShipmentStockItem,
  ShipmentHeadersResponse,
  ShipmentLinesResponse,
  ShipmentLineSerialsResponse,
  AssignedShipmentOrderLinesResponse,
  StokBarcodeResponse,
  AddBarcodeRequest,
  AddBarcodeResponse,
  CollectedBarcodesResponse,
  ShipmentHeader,
  ShipmentLine,
  ShipmentLineSerial,
} from '../types/shipment';
import { buildShipmentGenerateRequest } from '../utils/shipment-generate';
import { buildShipmentProcessRequest } from '../utils/shipment-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import { barcodeApi, toLegacyBarcodeStock } from '@/services/barcode-api';
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

export const shipmentApi = {
  getOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<ShipmentOrdersResponse> => {
    return await api.get<ShipmentOrdersResponse>(`/api/ShFunction/headers/${customerCode}`, options);
  },

  getOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<ShipmentOrderItemsResponse> => {
    return await api.get<ShipmentOrderItemsResponse>(`/api/ShFunction/lines/${orderNumbers}`, options);
  },

  getHeaders: async (options?: ApiRequestOptions): Promise<ShipmentHeadersResponse> => {
    const data = await shipmentApi.getHeadersPaged({}, options);
    return toLegacyCollectionResponse(data, 'Sevkiyat listesi yüklendi');
  },

  getHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<ShipmentHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>('/api/ShHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentHeadersLoadFailed'));
  },

  getAssignedHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<ShipmentHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>(
      `/api/ShHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentAssignedHeadersLoadFailed'));
  },

  getAssignedOrderLines: async (headerId: number, options?: ApiRequestOptions): Promise<AssignedShipmentOrderLinesResponse> => {
    return await api.get<AssignedShipmentOrderLinesResponse>(`/api/ShHeader/assigned-lines/${headerId}`, options);
  },

  getLines: async (headerId: number, options?: ApiRequestOptions): Promise<ShipmentLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<ShipmentLine>>>(`/api/ShLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Sevkiyat satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentLinesLoadFailed'));
  },

  getLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<ShipmentLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<ShipmentLineSerial>>>(`/api/ShLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Sevkiyat seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentSerialsLoadFailed'));
  },

  getStokBarcode: async (barcode: string, options?: ApiRequestOptions): Promise<StokBarcodeResponse> => {
    const response = await barcodeApi.resolve('shipping-assigned', barcode, options);
    return {
      ...response,
      data: response.success && response.data ? [toLegacyBarcodeStock(response.data)] : [],
    };
  },

  addBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/ShImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getCollectedBarcodes: async (headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/ShImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`, options);
  },

  completeShipment: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/ShHeader/complete/${headerId}`);
  },

  createShipment: async (
    formData: ShipmentFormData,
    selectedItems: SelectedShipmentOrderItem[],
  ): Promise<ApiResponse<unknown>> => {
    const request = buildShipmentGenerateRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/ShHeader/generate', request);
  },

  createStockBasedShipment: async (
    formData: ShipmentFormData,
    selectedItems: SelectedShipmentStockItem[],
  ): Promise<ApiResponse<unknown>> => {
    const request = buildShipmentGenerateRequest(formData, selectedItems, true);
    return await api.post<ApiResponse<unknown>>('/api/ShHeader/generate', request);
  },

  processShipment: async (
    formData: ShipmentFormData,
    selectedItems: SelectedShipmentStockItem[],
  ): Promise<ApiResponse<unknown>> => {
    const request = buildShipmentProcessRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/ShHeader/process', request);
  },

  getAwaitingApprovalHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<ShipmentHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>(
      '/api/ShHeader/completed-awaiting-erp-approval',
      requestBody,
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentApprovalLoadFailed'));
  },

  approveShipment: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/ShHeader/approval/${id}`, null, {
      params: { approved },
    });
  },
};
