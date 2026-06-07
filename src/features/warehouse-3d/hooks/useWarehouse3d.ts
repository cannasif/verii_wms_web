import { useQuery } from '@tanstack/react-query';
import { warehouse3dApi } from '../api/warehouse-3d-api';

export const useWarehouse3d = (depoKodu: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['warehouse3d', depoKodu],
    queryFn: () => warehouse3dApi.getWarehouseShelvesWithStockInformation(depoKodu),
    enabled: enabled && !!depoKodu,
    staleTime: 30 * 1000,
  });
};
