import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedParams } from '@/types/api';
import type {
  WarehouseBalanceRebuildResultDto,
  WarehouseStockBalanceDto,
  WarehouseStockBalancePagedResponse,
  WarehouseStockSerialBalanceDto,
  WarehouseStockSerialBalancePagedResponse,
} from '../types/warehouse-balance.types';

export const warehouseBalanceApi = {
  async getStockPaged(params?: PagedParams, options?: ApiRequestOptions): Promise<WarehouseStockBalancePagedResponse> {
    return await api.post<WarehouseStockBalancePagedResponse>(
      '/api/WarehouseBalance/stock-paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'StockCode',
        sortDirection: 'asc',
      }),
      options,
    );
  },

  async getSerialPaged(params?: PagedParams, options?: ApiRequestOptions): Promise<WarehouseStockSerialBalancePagedResponse> {
    return await api.post<WarehouseStockSerialBalancePagedResponse>(
      '/api/WarehouseBalance/serial-paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'LastTransactionDate',
        sortDirection: 'desc',
      }),
      options,
    );
  },

  async getStockById(id: number, options?: ApiRequestOptions): Promise<ApiResponse<WarehouseStockBalanceDto>> {
    return await api.get<ApiResponse<WarehouseStockBalanceDto>>(`/api/WarehouseBalance/stock/${id}`, options);
  },

  async getSerialById(id: number, options?: ApiRequestOptions): Promise<ApiResponse<WarehouseStockSerialBalanceDto>> {
    return await api.get<ApiResponse<WarehouseStockSerialBalanceDto>>(`/api/WarehouseBalance/serial/${id}`, options);
  },

  async rebuild(options?: ApiRequestOptions): Promise<ApiResponse<WarehouseBalanceRebuildResultDto>> {
    return await api.post<ApiResponse<WarehouseBalanceRebuildResultDto>>('/api/WarehouseBalance/rebuild', {}, options);
  },

  async rebuildByWarehouse(warehouseId: number, options?: ApiRequestOptions): Promise<ApiResponse<WarehouseBalanceRebuildResultDto>> {
    return await api.post<ApiResponse<WarehouseBalanceRebuildResultDto>>(`/api/WarehouseBalance/rebuild/warehouse/${warehouseId}`, {}, options);
  },

  async rebuildByStock(stockId: number, options?: ApiRequestOptions): Promise<ApiResponse<WarehouseBalanceRebuildResultDto>> {
    return await api.post<ApiResponse<WarehouseBalanceRebuildResultDto>>(`/api/WarehouseBalance/rebuild/stock/${stockId}`, {}, options);
  },
};
