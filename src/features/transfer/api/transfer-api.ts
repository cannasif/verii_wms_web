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
  TransferLine,
  TransferLineSerial,
} from '../types/transfer';
import { buildTransferGenerateRequest } from '../utils/transfer-generate';
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

export const transferApi = {
  getOrdersByCustomer: async (customerCode: string): Promise<TransferOrdersResponse> => {
    return await api.get<TransferOrdersResponse>(`/api/WtFunction/headers/${customerCode}`);
  },

  getOrderItems: async (orderNumbers: string): Promise<TransferOrderItemsResponse> => {
    return await api.get<TransferOrderItemsResponse>(`/api/WtFunction/lines/${orderNumbers}`);
  },

  getAssignedHeaders: async (userId: number): Promise<TransferHeadersResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<TransferHeader>>>(`/api/WtHeader/assigned/${userId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'desc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Atanmış transfer listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.transferAssignedHeadersLoadFailed'));
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
    const data = await transferApi.getHeadersPaged();
    return toLegacyCollectionResponse(data, 'Transfer listesi yüklendi');
  },

  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<TransferHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<TransferHeader>>>('/api/WtHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.transferHeadersLoadFailed'));
  },

  getLines: async (headerId: number): Promise<TransferLinesResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<TransferLine>>>(`/api/WtLine/header/${headerId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Transfer satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.transferLinesLoadFailed'));
  },

  getLineSerials: async (lineId: number): Promise<TransferLineSerialsResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<TransferLineSerial>>>(`/api/WtLineSerial/line/${lineId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Transfer seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.transferSerialsLoadFailed'));
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
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<AwaitingApprovalHeader>>>(
      '/api/WtHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.transferApprovalLoadFailed'));
  },

  approveTransfer: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/WtHeader/approval/${id}`, null, {
      params: { approved, id },
    });
  },
};
