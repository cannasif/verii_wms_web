import { api } from '@/lib/axios';
import type {
  ShipmentOrdersResponse,
  ShipmentOrderItemsResponse,
  ShipmentFormData,
  SelectedShipmentOrderItem,
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

export const shipmentApi = {
  getOrdersByCustomer: async (customerCode: string): Promise<ShipmentOrdersResponse> => {
    return await api.get<ShipmentOrdersResponse>(`/api/ShFunction/headers/${customerCode}`);
  },

  getOrderItems: async (orderNumbers: string): Promise<ShipmentOrderItemsResponse> => {
    return await api.get<ShipmentOrderItemsResponse>(`/api/ShFunction/lines/${orderNumbers}`);
  },

  getHeaders: async (): Promise<ShipmentHeadersResponse> => {
    const data = await shipmentApi.getHeadersPaged();
    return toLegacyCollectionResponse(data, 'Sevkiyat listesi yüklendi');
  },

  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<ShipmentHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>('/api/ShHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentHeadersLoadFailed'));
  },

  getAssignedHeaders: async (userId: number): Promise<ShipmentHeadersResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<ShipmentHeader>>>(`/api/ShHeader/assigned/${userId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'desc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Atanmış sevkiyat listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentAssignedHeadersLoadFailed'));
  },

  getAssignedOrderLines: async (headerId: number): Promise<AssignedShipmentOrderLinesResponse> => {
    return await api.get<AssignedShipmentOrderLinesResponse>(`/api/ShHeader/assigned-lines/${headerId}`);
  },

  getLines: async (headerId: number): Promise<ShipmentLinesResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<ShipmentLine>>>(`/api/ShLine/header/${headerId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Sevkiyat satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentLinesLoadFailed'));
  },

  getLineSerials: async (lineId: number): Promise<ShipmentLineSerialsResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<ShipmentLineSerial>>>(`/api/ShLineSerial/line/${lineId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Sevkiyat seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.shipmentSerialsLoadFailed'));
  },

  getStokBarcode: async (barcode: string, barcodeGroup: string = '1'): Promise<StokBarcodeResponse> => {
    return await api.get<StokBarcodeResponse>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup }
    });
  },

  addBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/ShImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getCollectedBarcodes: async (headerId: number): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/ShImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`);
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

  getAwaitingApprovalHeaders: async (params: PagedParams = {}): Promise<PagedResponse<ShipmentHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>(
      '/api/ShHeader/completed-awaiting-erp-approval',
      requestBody
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
