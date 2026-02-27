import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export function useAssignedShipmentHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_HEADERS, userId],
    queryFn: () => shipmentApi.getAssignedHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

