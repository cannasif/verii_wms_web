import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type { ErpCustomer, ErpProject, ErpWarehouse, ErpProduct, BranchErp } from './erp-types';

export const erpCommonApi = {
  getCustomers: async (): Promise<ErpCustomer[]> => {
    const response = await api.get('/api/Erp/getAllCustomers') as ApiResponse<ErpCustomer[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpCustomersLoadFailed'));
  },

  getProjects: async (): Promise<ErpProject[]> => {
    const response = await api.get('/api/Erp/getAllProjects') as ApiResponse<ErpProject[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpProjectsLoadFailed'));
  },

  getWarehouses: async (depoKodu?: number): Promise<ErpWarehouse[]> => {
    const url = depoKodu 
      ? `/api/Erp/getAllWarehouses?depoKodu=${depoKodu}`
      : '/api/Erp/getAllWarehouses';
    const response = await api.get(url) as ApiResponse<ErpWarehouse[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpWarehousesLoadFailed'));
  },

  getProducts: async (): Promise<ErpProduct[]> => {
    const response = await api.get('/api/Erp/getAllProducts') as ApiResponse<ErpProduct[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpProductsLoadFailed'));
  },

  getBranches: async (): Promise<BranchErp[]> => {
    const response = await api.get('/api/Erp/getBranches', { skipAuth: true }) as ApiResponse<BranchErp[]>;
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.erpBranchesLoadFailed'));
  },
};
