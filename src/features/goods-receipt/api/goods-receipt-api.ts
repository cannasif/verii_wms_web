import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import { barcodeApi, toLegacyBarcodeStock } from '@/services/barcode-api';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  Order,
  OrderItem,
  GoodsReceiptFormData,
  SelectedOrderItem,
  SelectedStockItem,
  GrHeader,
  GrLine,
  GrImportLine,
  AssignedGrOrderLinesResponse,
  StokBarcodeResponse,
  AddBarcodeRequest,
  AddBarcodeResponse,
  CollectedBarcodesResponse,
} from '../types/goods-receipt';
import { lookupApi } from '@/services/lookup-api';
import {
  buildGoodsReceiptGenerateOrderRequest,
  buildGoodsReceiptProcessRequest,
} from '../utils/goods-receipt-create';
import type { ApiRequestOptions } from '@/lib/request-utils';

export const goodsReceiptApi = {
  getCustomers: lookupApi.getCustomers,
  getProjects: lookupApi.getProjects,
  getWarehouses: lookupApi.getWarehouses,
  getProducts: lookupApi.getProducts,

  getOrdersByCustomer: async (customerCode: string, options?: ApiRequestOptions): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(`/api/GoodReciptFunctions/headers/customer/${customerCode}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptOrdersLoadFailed'));
  },

  getOrderItems: async (customerCode: string, siparisNoCsv: string, options?: ApiRequestOptions): Promise<OrderItem[]> => {
    const response = await api.get<ApiResponse<OrderItem[]>>(`/api/GoodReciptFunctions/lines/customer/${customerCode}/orders/${siparisNoCsv}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptOrderItemsLoadFailed'));
  },

  createGoodsReceiptOrder: async (formData: GoodsReceiptFormData, selectedItems: SelectedOrderItem[]): Promise<number> => {
    const request = buildGoodsReceiptGenerateOrderRequest(formData, selectedItems);
    const response = await api.post<ApiResponse<GrHeader>>('/api/GrHeader/generate', request);
    if (response.success) {
      return response.data?.id || 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptCreateFailed'));
  },

  createStockBasedGoodsReceiptOrder: async (formData: GoodsReceiptFormData, selectedItems: SelectedStockItem[]): Promise<number> => {
    const request = buildGoodsReceiptGenerateOrderRequest(formData, selectedItems, true);
    const response = await api.post<ApiResponse<GrHeader>>('/api/GrHeader/generate', request);
    if (response.success) {
      return response.data?.id || 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptCreateFailed'));
  },

  processGoodsReceipt: async (formData: GoodsReceiptFormData, selectedItems: SelectedStockItem[]): Promise<number> => {
    const request = buildGoodsReceiptProcessRequest(formData, selectedItems);
    const response = await api.post<ApiResponse<number>>('/api/GrHeader/process', request);
    if (response.success) {
      return response.data || 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptCreateFailed'));
  },

  getGrHeadersPaged: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<GrHeader>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1, sortBy: 'createdDate' });

    const response = await api.post<ApiResponse<PagedResponse<GrHeader>>>('/api/GrHeader/paged', requestBody, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptHeadersLoadFailed'));
  },

  getGrHeaderById: async (id: number, options?: ApiRequestOptions): Promise<GrHeader> => {
    const response = await api.get<ApiResponse<GrHeader>>(`/api/GrHeader/${id}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptHeaderDetailLoadFailed'));
  },

  getGrLines: async (headerId: number, options?: ApiRequestOptions): Promise<GrLine[]> => {
    const response = await api.post<ApiResponse<PagedResponse<GrLine>>>(`/api/GrLine/by-header/${headerId}/paged`, buildPagedRequest({ pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' }), options);
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptLinesLoadFailed'));
  },

  getGrImportLinesWithRoutes: async (headerId: number, options?: ApiRequestOptions): Promise<GrImportLine[]> => {
    const response = await api.get<ApiResponse<GrImportLine[]>>(`/api/GrImportLine/by-header-with-routes/${headerId}`, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptImportLinesLoadFailed'));
  },

  getAssignedHeaders: async (userId: number, params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<GrHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<GrHeader>>>(
      `/api/GrHeader/assigned/${userId}/paged`,
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptAssignedHeadersLoadFailed'));
  },

  getAwaitingApprovalHeaders: async (params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<GrHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<GrHeader>>>(
      '/api/GrHeader/completed-awaiting-erp-approval',
      buildPagedRequest(params, { pageNumber: 0, sortBy: 'Id', sortDirection: 'desc' }),
      options,
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.goodsReceiptApprovalLoadFailed'));
  },

  approveGoodsReceipt: async (id: number, approved: boolean): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/GrHeader/approval/${id}`, null, {
      params: { approved, id },
    });
  },

  getAssignedOrderLines: async (headerId: number, options?: ApiRequestOptions): Promise<AssignedGrOrderLinesResponse> => {
    return await api.get<AssignedGrOrderLinesResponse>(`/api/GrHeader/assigned-lines/${headerId}`, options);
  },

  getStokBarcode: async (barcode: string, options?: ApiRequestOptions): Promise<StokBarcodeResponse> => {
    const response = await barcodeApi.resolve('goods-receipt-assigned', barcode, options);
    return {
      ...response,
      data: response.success && response.data ? [toLegacyBarcodeStock(response.data)] : [],
    };
  },

  addBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/GrImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getCollectedBarcodes: async (headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/GrImportLine/warehouseGoodsReceiptOrderCollectedBarcodes/${headerId}`, options);
  },

  completeGoodsReceipt: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/GrHeader/complete/${headerId}`);
  },
};
