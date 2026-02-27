import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';
import type { PagedParams } from '@/types/api';

export function useShipmentHeaders() {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.HEADERS],
    queryFn: () => shipmentApi.getHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useShipmentHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.HEADERS_PAGED, params],
    queryFn: () => shipmentApi.getHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}
