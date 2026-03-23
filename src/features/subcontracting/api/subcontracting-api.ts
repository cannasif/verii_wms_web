import { api } from '@/lib/axios';
import type {
  SubcontractingOrdersResponse,
  SubcontractingOrderItemsResponse,
  SubcontractingFormData,
  SelectedSubcontractingOrderItem,
  SubcontractingHeadersResponse,
  SubcontractingLinesResponse,
  SubcontractingLineSerialsResponse,
  AssignedSubcontractingOrderLinesResponse,
  StokBarcodeResponse,
  AddBarcodeRequest,
  AddBarcodeResponse,
  CollectedBarcodesResponse,
  SubcontractingHeader,
  SubcontractingLine,
  SubcontractingLineSerial,
} from '../types/subcontracting';
import { buildSubcontractingIssueRequest, buildSubcontractingReceiptRequest } from '../utils/subcontracting-generate';
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

export const subcontractingApi = {
  getReceiptOrdersByCustomer: async (customerCode: string): Promise<SubcontractingOrdersResponse> => {
    return await api.get<SubcontractingOrdersResponse>(`/api/SrtFunction/headers/${customerCode}`);
  },

  getReceiptOrderItems: async (orderNumbers: string): Promise<SubcontractingOrderItemsResponse> => {
    return await api.get<SubcontractingOrderItemsResponse>(`/api/SrtFunction/lines/${orderNumbers}`);
  },

  getIssueOrdersByCustomer: async (customerCode: string): Promise<SubcontractingOrdersResponse> => {
    return await api.get<SubcontractingOrdersResponse>(`/api/SitFunction/headers/${customerCode}`);
  },

  getIssueOrderItems: async (orderNumbers: string): Promise<SubcontractingOrderItemsResponse> => {
    return await api.get<SubcontractingOrderItemsResponse>(`/api/SitFunction/lines/${orderNumbers}`);
  },

  getAssignedSitHeaders: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      `/api/SitHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingAssignedIssueHeadersLoadFailed'));
  },

  getAssignedSrtHeaders: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      `/api/SrtHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingAssignedReceiptHeadersLoadFailed'));
  },

  getAssignedSitOrderLines: async (headerId: number): Promise<AssignedSubcontractingOrderLinesResponse> => {
    return await api.get<AssignedSubcontractingOrderLinesResponse>(`/api/SitHeader/getAssignedOrderLines/${headerId}`);
  },

  getAssignedSrtOrderLines: async (headerId: number): Promise<AssignedSubcontractingOrderLinesResponse> => {
    return await api.get<AssignedSubcontractingOrderLinesResponse>(`/api/SrtHeader/getAssignedOrderLines/${headerId}`);
  },

  getStokBarcode: async (barcode: string, barcodeGroup: string = '1'): Promise<StokBarcodeResponse> => {
    return await api.get<StokBarcodeResponse>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup }
    });
  },

  addSitBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/SitImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  addSrtBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/SrtImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getSitCollectedBarcodes: async (headerId: number): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/SitImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`);
  },

  getSrtCollectedBarcodes: async (headerId: number): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/SrtImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`);
  },

  completeSit: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/SitHeader/complete/${headerId}`);
  },

  completeSrt: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/SrtHeader/complete/${headerId}`);
  },

  createSubcontractingIssue: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingIssueRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/SitHeader/generate', request);
  },

  createSubcontractingReceipt: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingReceiptRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/SrtHeader/generate', request);
  },

  getReceiptHeaders: async (): Promise<SubcontractingHeadersResponse> => {
    const data = await subcontractingApi.getReceiptHeadersPaged();
    return toLegacyCollectionResponse(data, 'Taşeron alış listesi yüklendi');
  },

  getIssueHeaders: async (): Promise<SubcontractingHeadersResponse> => {
    const data = await subcontractingApi.getIssueHeadersPaged();
    return toLegacyCollectionResponse(data, 'Taşeron çıkış listesi yüklendi');
  },

  getReceiptHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SrtHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptHeadersLoadFailed'));
  },

  getIssueHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SitHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueHeadersLoadFailed'));
  },

  getReceiptLines: async (headerId: number): Promise<SubcontractingLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLine>>>(`/api/SrtLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason giriş satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptLinesLoadFailed'));
  },

  getIssueLines: async (headerId: number): Promise<SubcontractingLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLine>>>(`/api/SitLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason çıkış satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueLinesLoadFailed'));
  },

  getReceiptLineSerials: async (lineId: number): Promise<SubcontractingLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLineSerial>>>(`/api/SrtLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason giriş seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptSerialsLoadFailed'));
  },

  getIssueLineSerials: async (lineId: number): Promise<SubcontractingLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLineSerial>>>(`/api/SitLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }));
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason çıkış seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueSerialsLoadFailed'));
  },

  getAwaitingApprovalSitHeaders: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SitHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueApprovalLoadFailed'));
  },

  getAwaitingApprovalSrtHeaders: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SrtHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptApprovalLoadFailed'));
  },

  approveSitHeader: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/SitHeader/approval/${id}`, null, {
      params: { approved },
    });
  },

  approveSrtHeader: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/SrtHeader/approval/${id}`, null, {
      params: { approved },
    });
  },
};
