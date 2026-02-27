import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export const useShipmentOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ORDER_ITEMS, orderNumbers],
    queryFn: () => shipmentApi.getOrderItems(orderNumbers!),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};
