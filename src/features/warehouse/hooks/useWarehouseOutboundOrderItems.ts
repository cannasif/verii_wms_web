import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export const useWarehouseOutboundOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: ['warehouse-outbound-order-items', orderNumbers],
    queryFn: ({ signal }) => warehouseApi.getOutboundOrderItems(orderNumbers!, { signal }),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

