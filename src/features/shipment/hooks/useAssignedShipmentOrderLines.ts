import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useAssignedShipmentOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId],
    queryFn: () => {
      if (!headerId) throw new Error('Header ID is required');
      return shipmentApi.getAssignedOrderLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

