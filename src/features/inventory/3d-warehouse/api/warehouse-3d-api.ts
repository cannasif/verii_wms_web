import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { WarehouseShelvesWithStockInformationDto } from '../types/warehouse-3d';

export const warehouse3dApi = {
  getWarehouseShelvesWithStockInformation: async (
    depoKodu: string
  ): Promise<WarehouseShelvesWithStockInformationDto[]> => {
    const response = await api.get<ApiResponse<WarehouseShelvesWithStockInformationDto[]>>(
      `/api/Erp/getWarehouseShelvesWithStockInformation?depoKodu=${depoKodu}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Depo bilgileri yüklenemedi');
  },
};
