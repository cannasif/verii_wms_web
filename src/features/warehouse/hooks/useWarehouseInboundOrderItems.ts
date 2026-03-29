import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export const useWarehouseInboundOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: ['warehouse-inbound-order-items', orderNumbers],
    queryFn: ({ signal }) => warehouseApi.getInboundOrderItems(orderNumbers!, { signal }),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

