import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalShipmentHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: [SHIPMENT_QUERY_KEYS.AWAITING_APPROVAL_HEADERS, params],
    queryFn: () => shipmentApi.getAwaitingApprovalHeaders(params),
    staleTime: 30 * 1000,
  });
}

