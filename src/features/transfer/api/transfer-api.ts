import { api } from '@/lib/axios';
import type {
  TransferOrdersResponse,
  TransferOrderItemsResponse,
  TransferFormData,
  SelectedTransferOrderItem,
  SelectedTransferStockItem,
  TransferHeadersResponse,
  TransferLinesResponse,
  TransferLineSerialsResponse,
  AssignedTransferOrderLinesResponse,
  StokBarcodeResponse,
  AddBarcodeRequest,
  AddBarcodeResponse,
  CollectedBarcodesResponse,
  TransferHeader,
  AwaitingApprovalHeader,
} from '../types/transfer';
import { buildTransferGenerateRequest } from '../utils/transfer-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export const transferApi = {
  getOrdersByCustomer: async (customerCode: string): Promise<TransferOrdersResponse> => {
    return await api.get<TransferOrdersResponse>(`/api/WtFunction/headers/${customerCode}`);
  },

  getOrderItems: async (orderNumbers: string): Promise<TransferOrderItemsResponse> => {
    return await api.get<TransferOrderItemsResponse>(`/api/WtFunction/lines/${orderNumbers}`);
  },

  getAssignedHeaders: async (userId: number): Promise<TransferHeadersResponse> => {
    return await api.get<TransferHeadersResponse>(`/api/WtHeader/assigned/${userId}`);
  },

  getAssignedOrderLines: async (headerId: number): Promise<AssignedTransferOrderLinesResponse> => {
    return await api.get<AssignedTransferOrderLinesResponse>(`/api/WtHeader/getAssignedTransferOrderLines/${headerId}`);
  },

  createTransfer: async (
    formData: TransferFormData,
    selectedItems: (SelectedTransferOrderItem | SelectedTransferStockItem)[],
    isFreeTransfer: boolean
  ): Promise<ApiResponse<unknown>> => {
    const request = buildTransferGenerateRequest(formData, selectedItems, isFreeTransfer);
    return await api.post<ApiResponse<unknown>>('/api/WtHeader/generate', request);
  },

  getHeaders: async (): Promise<TransferHeadersResponse> => {
    return await api.get<TransferHeadersResponse>('/api/WtHeader');
  },

  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<TransferHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<TransferHeader>>>('/api/WtHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Transfer listesi yüklenemedi');
  },

  getLines: async (headerId: number): Promise<TransferLinesResponse> => {
    return await api.get<TransferLinesResponse>(`/api/WtLine/header/${headerId}`);
  },

  getLineSerials: async (lineId: number): Promise<TransferLineSerialsResponse> => {
    return await api.get<TransferLineSerialsResponse>(`/api/WtLineSerial/line/${lineId}`);
  },

  getStokBarcode: async (barcode: string, barcodeGroup: string = '1'): Promise<StokBarcodeResponse> => {
    return await api.get<StokBarcodeResponse>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup }
    });
  },

  addBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/WtImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getCollectedBarcodes: async (headerId: number): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/WtImportLine/warehouseTransferOrderCollectedBarcodes/${headerId}`);
  },

  deleteRoute: async (routeId: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/WtRoute/${routeId}`);
  },

  completeTransfer: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/WtHeader/complete/${headerId}`);
  },

  getAwaitingApprovalHeaders: async (params: PagedParams = {}): Promise<PagedResponse<AwaitingApprovalHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<AwaitingApprovalHeader>>>(
      '/api/WtHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen emirler yüklenemedi');
  },

  approveTransfer: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/WtHeader/approval/${id}`, null, {
      params: { approved, id },
    });
  },
};