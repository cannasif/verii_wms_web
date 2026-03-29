import { api } from '@/lib/axios';
import type { ApiResponse, PagedResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type { ErpCustomer, ErpProject, ErpWarehouse, ErpProduct, BranchErp } from './erp-types';
import type { ApiRequestOptions } from '@/lib/request-utils';
import { buildPagedRequest } from '@/lib/paged';

async function getFirstPageData<T>(url: string, options?: ApiRequestOptions): Promise<T[]> {
  const response = await api.post<ApiResponse<PagedResponse<T>>>(url, buildPagedRequest({ pageNumber: 1, pageSize: 1000 }), options);
  if (response.success && response.data) {
    return response.data.data;
  }
  throw new Error(response.message || getLocalizedText('common.errors.unknown'));
}

export const erpCommonApi = {
  getCustomers: async (options?: ApiRequestOptions): Promise<ErpCustomer[]> => {
    try {
      return await getFirstPageData<ErpCustomer>('/api/Erp/customers/paged', options);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : getLocalizedText('common.errors.erpCustomersLoadFailed'));
    }
  },

  getProjects: async (options?: ApiRequestOptions): Promise<ErpProject[]> => {
    try {
      return await getFirstPageData<ErpProject>('/api/Erp/projects/paged', options);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : getLocalizedText('common.errors.erpProjectsLoadFailed'));
    }
  },

  getWarehouses: async (depoKodu?: number, options?: ApiRequestOptions): Promise<ErpWarehouse[]> => {
    try {
      const url = depoKodu
        ? `/api/Erp/warehouses/paged?depoKodu=${depoKodu}`
        : '/api/Erp/warehouses/paged';
      return await getFirstPageData<ErpWarehouse>(url, options);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : getLocalizedText('common.errors.erpWarehousesLoadFailed'));
    }
  },

  getProducts: async (options?: ApiRequestOptions): Promise<ErpProduct[]> => {
    try {
      return await getFirstPageData<ErpProduct>('/api/Erp/products/paged', options);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : getLocalizedText('common.errors.erpProductsLoadFailed'));
    }
  },

  getBranches: async (options?: ApiRequestOptions): Promise<BranchErp[]> => {
    const response = await api.get('/api/Erp/getBranches', { skipAuth: true, ...options }) as ApiResponse<BranchErp[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpBranchesLoadFailed'));
  },
};
