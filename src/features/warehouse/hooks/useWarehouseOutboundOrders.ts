import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export const useWarehouseOutboundOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: ['warehouse-outbound-orders', customerCode],
    queryFn: ({ signal }) => warehouseApi.getOutboundOrdersByCustomer(customerCode!, { signal }),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};

