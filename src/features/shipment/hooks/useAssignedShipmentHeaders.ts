import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import type { PagedParams } from '@/types/api';

export function useAssignedShipmentHeaders(params: PagedParams = {}) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_HEADERS, userId, params],
    queryFn: ({ signal }) => shipmentApi.getAssignedHeaders(userId || 0, params, { signal }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
