import { api } from '@/lib/axios';
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
    const { pageNumber = 1, pageSize = 10, sortBy = 'createdDate', sortDirection = 'desc', filters = [] } = params;

    const requestBody = {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    };

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
    const response = await api.get<ApiResponse<GrLine[]>>(`/api/GrLine/by-header/${headerId}`);
    if (response.success && response.data) {
      return response.data;
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
    return await api.get<GrHeadersResponse>(`/api/GrHeader/assigned/${userId}`);
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
