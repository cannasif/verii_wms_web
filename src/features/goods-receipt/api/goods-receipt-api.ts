import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
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
  GrHeadersResponse,
  AssignedGrOrderLinesResponse,
  StokBarcodeResponse,
  AddBarcodeRequest,
  AddBarcodeResponse,
  CollectedBarcodesResponse,
} from '../types/goods-receipt';
import { erpCommonApi } from '@/services/erp-common-api';
import { buildGoodsReceiptBulkCreateRequest } from '../utils/goods-receipt-create';

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

export const goodsReceiptApi = {
  getCustomers: erpCommonApi.getCustomers,
  getProjects: erpCommonApi.getProjects,
  getWarehouses: erpCommonApi.getWarehouses,
  getProducts: erpCommonApi.getProducts,

  getOrdersByCustomer: async (customerCode: string): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(`/api/GoodReciptFunctions/headers/customer/${customerCode}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Siparişler yüklenemedi');
  },

  getOrderItems: async (customerCode: string, siparisNoCsv: string): Promise<OrderItem[]> => {
    const response = await api.get<ApiResponse<OrderItem[]>>(`/api/GoodReciptFunctions/lines/customer/${customerCode}/orders/${siparisNoCsv}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Sipariş kalemleri yüklenemedi');
  },

  createGoodsReceipt: async (formData: GoodsReceiptFormData, selectedItems: (SelectedOrderItem | SelectedStockItem)[], isStockBased: boolean = false): Promise<number> => {
    const request = buildGoodsReceiptBulkCreateRequest(formData, selectedItems, isStockBased);
    const response = await api.post<ApiResponse<number>>('/api/GrHeader/bulkCreate', request);
    if (response.success) {
      return response.data || 0;
    }
    throw new Error(response.message || 'Mal kabul oluşturulamadı');
  },

  getGrHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<GrHeader>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1, sortBy: 'createdDate' });

    const response = await api.post<ApiResponse<PagedResponse<GrHeader>>>('/api/GrHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Mal kabul listesi yüklenemedi');
  },

  getGrHeaderById: async (id: number): Promise<GrHeader> => {
    const response = await api.get<ApiResponse<GrHeader>>(`/api/GrHeader/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Mal kabul detayı yüklenemedi');
  },

  getGrLines: async (headerId: number): Promise<GrLine[]> => {
    const response = await api.get<ApiResponse<PagedResponse<GrLine>>>(`/api/GrLine/by-header/${headerId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'asc' },
    });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Mal kabul satırları yüklenemedi');
  },

  getGrImportLinesWithRoutes: async (headerId: number): Promise<GrImportLine[]> => {
    const response = await api.get<ApiResponse<GrImportLine[]>>(`/api/GrImportLine/by-header-with-routes/${headerId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Mal kabul içerik satırları yüklenemedi');
  },

  getAssignedHeaders: async (userId: number): Promise<GrHeadersResponse> => {
    const response = await api.get<ApiResponse<PagedResponse<GrHeader>>>(`/api/GrHeader/assigned/${userId}`, {
      params: { pageNumber: 0, pageSize: 1000, sortBy: 'Id', sortDirection: 'desc' },
    });
    if (response.success && response.data) {
      return toLegacyCollectionResponse(response.data, response.message || 'Atanmış mal kabul listesi yüklendi');
    }
    throw new Error(response.message || 'Atanmış mal kabul listesi yüklenemedi');
  },

  getAssignedOrderLines: async (headerId: number): Promise<AssignedGrOrderLinesResponse> => {
    return await api.get<AssignedGrOrderLinesResponse>(`/api/GrHeader/assigned-lines/${headerId}`);
  },

  getStokBarcode: async (barcode: string, barcodeGroup: string = '1'): Promise<StokBarcodeResponse> => {
    return await api.get<StokBarcodeResponse>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup }
    });
  },

  addBarcodeToOrder: async (request: AddBarcodeRequest): Promise<AddBarcodeResponse> => {
    return await api.post<AddBarcodeResponse>('/api/GrImportLine/addBarcodeBasedonAssignedOrder', request);
  },

  getCollectedBarcodes: async (headerId: number): Promise<CollectedBarcodesResponse> => {
    return await api.get<CollectedBarcodesResponse>(`/api/GrImportLine/warehouseGoodsReceiptOrderCollectedBarcodes/${headerId}`);
  },

  completeGoodsReceipt: async (headerId: number): Promise<ApiResponse<unknown>> => {
    return await api.post<ApiResponse<unknown>>(`/api/GrHeader/complete/${headerId}`);
  },
};
