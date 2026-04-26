import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type { SteelPlacementVisualizationDto, WarehouseShelvesWithStockInformationDto } from '../types/warehouse-3d';

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
    
    throw new Error(response.message || getLocalizedText('common.errors.warehouse3dLoadFailed'));
  },

  getSteelPlacementVisualization: async (
    warehouseId: number,
    shelfId?: number | null,
    areaCode?: string | null,
  ): Promise<SteelPlacementVisualizationDto> => {
    const response = await api.get<ApiResponse<SteelPlacementVisualizationDto>>('/api/SteelGoodReciptAcceptanse/placement/visualization', {
      params: { warehouseId, shelfId, areaCode },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || getLocalizedText('common.errors.warehouse3dLoadFailed'));
  },
};
