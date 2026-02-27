import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useShipmentLineSerials(lineId: number | null) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.LINE_SERIALS, lineId],
    queryFn: () => {
      if (!lineId) throw new Error('Line ID is required');
      return shipmentApi.getLineSerials(lineId);
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}
