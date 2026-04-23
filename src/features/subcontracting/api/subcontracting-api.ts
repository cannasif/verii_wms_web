import { api } from '@/lib/axios';
import type {
  SubcontractingOrdersResponse,
  SubcontractingOrderItemsResponse,
  SubcontractingFormData,
  SelectedSubcontractingOrderItem,
  SelectedSubcontractingStockItem,
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
import {
  buildSubcontractingIssueProcessRequest,
  buildSubcontractingIssueRequest,
  buildSubcontractingReceiptProcessRequest,
  buildSubcontractingReceiptRequest,
} from '../utils/subcontracting-generate';
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

export const subcontractingApi = {
  // RII_FN-backed source: receipt order headers stay full-read function results.
  getReceiptOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<SubcontractingOrdersResponse> => {
    return await api.get<SubcontractingOrdersResponse>(`/api/SrtFunction/headers/${customerCode}`, options);
  },

  // RII_FN-backed source: receipt item list remains function-based.
  getReceiptOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<SubcontractingOrderItemsResponse> => {
    return await api.get<SubcontractingOrderItemsResponse>(`/api/SrtFunction/lines/${orderNumbers}`, options);
  },

  // RII_FN-backed source: issue order headers stay full-read function results.
  getIssueOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<SubcontractingOrdersResponse> => {
    return await api.get<SubcontractingOrdersResponse>(`/api/SitFunction/headers/${customerCode}`, options);
  },

  // RII_FN-backed source: issue item list remains function-based.
  getIssueOrderItems: async (orderNumbers: string, options?: ApiRequestOptions): Promise<SubcontractingOrderItemsResponse> => {
    return await api.get<SubcontractingOrderItemsResponse>(`/api/SitFunction/lines/${orderNumbers}`, options);
  },

  getAssignedSitHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      `/api/SitHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingAssignedIssueHeadersLoadFailed'));
  },

  getAssignedSrtHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      `/api/SrtHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingAssignedReceiptHeadersLoadFailed'));
  },

  getAssignedSitOrderLines: async (headerId: number, options?: ApiRequestOptions): Promise<AssignedSubcontractingOrderLinesResponse> => {
    return await api.get<AssignedSubcontractingOrderLinesResponse>(`/api/SitHeader/getAssignedOrderLines/${headerId}`, options);
  },

  getAssignedSrtOrderLines: async (headerId: number, options?: ApiRequestOptions): Promise<AssignedSubcontractingOrderLinesResponse> => {
    return await api.get<AssignedSubcontractingOrderLinesResponse>(`/api/SrtHeader/getAssignedOrderLines/${headerId}`, options);
  },

  getStokBarcode: async (moduleKey: string, barcode: string, options?: ApiRequestOptions): Promise<StokBarcodeResponse> => {
    const response = await barcodeApi.resolve(moduleKey, barcode, options);
    return {
      ...response,
      data: response.success && response.data ? [toLegacyBarcodeStock(response.data)] : [],
    };
  },

  addSitBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/SitImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  addSrtBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/SrtImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getSitCollectedBarcodes: async (headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/SitImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`, options);
  },

  getSrtCollectedBarcodes: async (headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/SrtImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`, options);
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

  createStockBasedSubcontractingIssue: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingIssueRequest(formData, selectedItems, true);
    return await api.post<ApiResponse<unknown>>('/api/SitHeader/generate', request);
  },

  createSubcontractingReceipt: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingOrderItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingReceiptRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/SrtHeader/generate', request);
  },

  createStockBasedSubcontractingReceipt: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingStockItem[]
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingReceiptRequest(formData, selectedItems, true);
    return await api.post<ApiResponse<unknown>>('/api/SrtHeader/generate', request);
  },

  processSubcontractingIssue: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingStockItem[],
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingIssueProcessRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/SitHeader/process', request);
  },

  processSubcontractingReceipt: async (
    formData: SubcontractingFormData,
    selectedItems: SelectedSubcontractingStockItem[],
  ): Promise<ApiResponse<unknown>> => {
    const request = buildSubcontractingReceiptProcessRequest(formData, selectedItems);
    return await api.post<ApiResponse<unknown>>('/api/SrtHeader/process', request);
  },

  getReceiptHeaders: async (options?: ApiRequestOptions): Promise<SubcontractingHeadersResponse> => {
    const data = await subcontractingApi.getReceiptHeadersPaged({}, options);
    return toLegacyCollectionResponse(data, 'Taşeron alış listesi yüklendi');
  },

  getIssueHeaders: async (options?: ApiRequestOptions): Promise<SubcontractingHeadersResponse> => {
    const data = await subcontractingApi.getIssueHeadersPaged({}, options);
    return toLegacyCollectionResponse(data, 'Taşeron çıkış listesi yüklendi');
  },

  getReceiptHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SrtHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptHeadersLoadFailed'));
  },

  getIssueHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SitHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueHeadersLoadFailed'));
  },

  getReceiptLines: async (headerId: number, options?: ApiRequestOptions): Promise<SubcontractingLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLine>>>(`/api/SrtLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason giriş satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptLinesLoadFailed'));
  },

  getIssueLines: async (headerId: number, options?: ApiRequestOptions): Promise<SubcontractingLinesResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLine>>>(`/api/SitLine/header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason çıkış satırları yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueLinesLoadFailed'));
  },

  getReceiptLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<SubcontractingLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLineSerial>>>(`/api/SrtLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason giriş seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptSerialsLoadFailed'));
  },

  getIssueLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<SubcontractingLineSerialsResponse> => {
    const response = await api.post<ApiResponse<PagedResponse<SubcontractingLineSerial>>>(`/api/SitLineSerial/line/${lineId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Fason çıkış seri listesi yüklendi');
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueSerialsLoadFailed'));
  },

  getAwaitingApprovalSitHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SitHeader/completed-awaiting-erp-approval',
      requestBody,
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueApprovalLoadFailed'));
  },

  getAwaitingApprovalSrtHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SrtHeader/completed-awaiting-erp-approval',
      requestBody,
      options,
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
