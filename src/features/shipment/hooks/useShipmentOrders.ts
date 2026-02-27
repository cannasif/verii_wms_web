import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export const useShipmentOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ORDERS, customerCode],
    queryFn: () => shipmentApi.getOrdersByCustomer(customerCode!),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};