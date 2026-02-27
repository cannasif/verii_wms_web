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
} from '../types/subcontracting';
import { buildSubcontractingIssueRequest, buildSubcontractingReceiptRequest } from '../utils/subcontracting-generate';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

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

  getAssignedSitHeaders: async (userId: number): Promise<SubcontractingHeadersResponse> => {
    return await api.get<SubcontractingHeadersResponse>(`/api/SitHeader/assigned/${userId}`);
  },

  getAssignedSrtHeaders: async (userId: number): Promise<SubcontractingHeadersResponse> => {
    return await api.get<SubcontractingHeadersResponse>(`/api/SrtHeader/assigned/${userId}`);
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
    return await api.get<SubcontractingHeadersResponse>('/api/SrtHeader');
  },

  getIssueHeaders: async (): Promise<SubcontractingHeadersResponse> => {
    return await api.get<SubcontractingHeadersResponse>('/api/SitHeader');
  },

  getReceiptHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SrtHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Taşeron alış listesi yüklenemedi');
  },

  getIssueHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>('/api/SitHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Taşeron çıkış listesi yüklenemedi');
  },

  getReceiptLines: async (headerId: number): Promise<SubcontractingLinesResponse> => {
    return await api.get<SubcontractingLinesResponse>(`/api/SrtLine/header/${headerId}`);
  },

  getIssueLines: async (headerId: number): Promise<SubcontractingLinesResponse> => {
    return await api.get<SubcontractingLinesResponse>(`/api/SitLine/header/${headerId}`);
  },

  getReceiptLineSerials: async (lineId: number): Promise<SubcontractingLineSerialsResponse> => {
    return await api.get<SubcontractingLineSerialsResponse>(`/api/SrtLineSerial/line/${lineId}`);
  },

  getIssueLineSerials: async (lineId: number): Promise<SubcontractingLineSerialsResponse> => {
    return await api.get<SubcontractingLineSerialsResponse>(`/api/SitLineSerial/line/${lineId}`);
  },

  getAwaitingApprovalSitHeaders: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SitHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen fason çıkış emirleri yüklenemedi');
  },

  getAwaitingApprovalSrtHeaders: async (params: PagedParams = {}): Promise<PagedResponse<SubcontractingHeader>> => {
    const { pageNumber = 0, pageSize = 10, sortBy = 'Id', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

    const response = await api.post<ApiResponse<PagedResponse<SubcontractingHeader>>>(
      '/api/SrtHeader/completed-awaiting-erp-approval',
      requestBody
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Onay bekleyen fason giriş emirleri yüklenemedi');
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

