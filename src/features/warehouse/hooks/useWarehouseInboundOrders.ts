import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export const useWarehouseInboundOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: ['warehouse-inbound-orders', customerCode],
    queryFn: () => warehouseApi.getInboundOrdersByCustomer(customerCode!),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};

