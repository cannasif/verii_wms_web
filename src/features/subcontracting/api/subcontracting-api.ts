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
import { barcodeApi, toLegacyBarcodeStock } from '@/features/shared/api/barcode-api';
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
      buildPagedRequest(params, { pageNumber: 1, sortBy: 'Id', sortDirection: 'desc' }),
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
      buildPagedRequest(params, { pageNumber: 1, sortBy: 'Id', sortDirection: 'desc' }),
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

  getReceiptHeaderById: async (id: number, options?: ApiRequestOptions): Promise<SubcontractingHeader> => {
    const response = await api.get<ApiResponse<SubcontractingHeader>>(`/api/SrtHeader/${id}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingReceiptHeadersLoadFailed'));
  },

  updateReceiptHeader: async (id: number, formData: SubcontractingFormData): Promise<ApiResponse<SubcontractingHeader>> => {
    return await api.put<ApiResponse<SubcontractingHeader>>(`/api/SrtHeader/${id}`, {
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      plannedDate: formData.transferDate,
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
      documentType: 'SRT',
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder ?? false,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder ?? false,
    });
  },

  getIssueHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<SubcontractingHeader>> => {
    const requestBody = buildPagedRequest(params);

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SitHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueHeadersLoadFailed'));
  },

  getIssueHeaderById: async (id: number, options?: ApiRequestOptions): Promise<SubcontractingHeader> => {
    const response = await api.get<ApiResponse<SubcontractingHeader>>(`/api/SitHeader/${id}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.subcontractingIssueHeadersLoadFailed'));
  },

  updateIssueHeader: async (id: number, formData: SubcontractingFormData): Promise<ApiResponse<SubcontractingHeader>> => {
    return await api.put<ApiResponse<SubcontractingHeader>>(`/api/SitHeader/${id}`, {
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      plannedDate: formData.transferDate,
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
      documentType: 'SIT',
      allowLessQuantityBasedOnOrder: formData.allowLessQuantityBasedOnOrder ?? false,
      allowMoreQuantityBasedOnOrder: formData.allowMoreQuantityBasedOnOrder ?? false,
    });
  },

  getReceiptLines: async (headerId: number, options?: ApiRequestOptions): Promise<SubcontractingLinesResponse> => {
    const data = await getAllPagedData<SubcontractingLine>(`/api/SrtLine/header/${headerId}/paged`, options, 'common.errors.subcontractingReceiptLinesLoadFailed');
    return toLegacyCollectionResponse(data, 'Fason giriş satırları yüklendi');
  },

  getIssueLines: async (headerId: number, options?: ApiRequestOptions): Promise<SubcontractingLinesResponse> => {
    const data = await getAllPagedData<SubcontractingLine>(`/api/SitLine/header/${headerId}/paged`, options, 'common.errors.subcontractingIssueLinesLoadFailed');
    return toLegacyCollectionResponse(data, 'Fason çıkış satırları yüklendi');
  },

  getReceiptLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<SubcontractingLineSerialsResponse> => {
    const data = await getAllPagedData<SubcontractingLineSerial>(`/api/SrtLineSerial/line/${lineId}/paged`, options, 'common.errors.subcontractingReceiptSerialsLoadFailed');
    return toLegacyCollectionResponse(data, 'Fason giriş seri listesi yüklendi');
  },

  getIssueLineSerials: async (lineId: number, options?: ApiRequestOptions): Promise<SubcontractingLineSerialsResponse> => {
    const data = await getAllPagedData<SubcontractingLineSerial>(`/api/SitLineSerial/line/${lineId}/paged`, options, 'common.errors.subcontractingIssueSerialsLoadFailed');
    return toLegacyCollectionResponse(data, 'Fason çıkış seri listesi yüklendi');
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

  deleteIssueHeader: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/SitHeader/${id}`);
  },

  deleteReceiptHeader: async (id: number): Promise<ApiResponse<boolean>> => {
    return await api.delete<ApiResponse<boolean>>(`/api/SrtHeader/${id}`);
  },
};
