import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useAssignedShipmentOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId],
    queryFn: ({ signal }) => {
      if (!headerId) throw createRequiredIdError('header');
      return shipmentApi.getAssignedOrderLines(headerId, { signal });
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}
