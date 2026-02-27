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
} from '../types/shipment';
import { buildShipmentGenerateRequest } from '../utils/shipment-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export const shipmentApi = {
  getOrdersByCustomer: async (customerCode: string): Promise<ShipmentOrdersResponse> => {
    return await api.get<ShipmentOrdersResponse>(`/api/ShFunction/headers/${customerCode}`);
  },

  getOrderItems: async (orderNumbers: string): Promise<ShipmentOrderItemsResponse> => {
    return await api.get<ShipmentOrderItemsResponse>(`/api/ShFunction/lines/${orderNumbers}`);
  },

  getHeaders: async (): Promise<ShipmentHeadersResponse> => {
    return await api.get<ShipmentHeadersResponse>('/api/ShHeader');
  },

  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<ShipmentHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>('/api/ShHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Sevkiyat listesi yüklenemedi');
  },

  getAssignedHeaders: async (userId: number): Promise<ShipmentHeadersResponse> => {
    return await api.get<ShipmentHeadersResponse>(`/api/ShHeader/assigned/${userId}`);
  },

  getAssignedOrderLines: async (headerId: number): Promise<AssignedShipmentOrderLinesResponse> => {
    return await api.get<AssignedShipmentOrderLinesResponse>(`/api/ShHeader/assigned-lines/${headerId}`);
  },

  getLines: async (headerId: number): Promise<ShipmentLinesResponse> => {
    return await api.get<ShipmentLinesResponse>(`/api/ShLine/header/${headerId}`);
  },

  getLineSerials: async (lineId: number): Promise<ShipmentLineSerialsResponse> => {
    return await api.get<ShipmentLineSerialsResponse>(`/api/ShLineSerial/line/${lineId}`);
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
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<ShipmentHeader>>>(
      '/api/ShHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen sevkiyat emirleri yüklenemedi');
  },

  approveShipment: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/ShHeader/approval/${id}`, null, {
      params: { approved },
    });
  },
};
