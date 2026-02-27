import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export const useWarehouseInboundOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: ['warehouse-inbound-order-items', orderNumbers],
    queryFn: () => warehouseApi.getInboundOrderItems(orderNumbers!),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

