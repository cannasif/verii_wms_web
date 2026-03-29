import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useShipmentLineSerials(lineId: number | null) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.LINE_SERIALS, lineId],
    queryFn: ({ signal }) => {
      if (!lineId) throw createRequiredIdError('line');
      return shipmentApi.getLineSerials(lineId, { signal });
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}
