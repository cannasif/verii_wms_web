import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useShipmentLines(headerId: number | null) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.LINES, headerId],
    queryFn: ({ signal }) => {
      if (!headerId) throw createRequiredIdError('header');
      return shipmentApi.getLines(headerId, { signal });
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}
