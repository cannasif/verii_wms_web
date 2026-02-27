import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export function useAssignedTransferOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId],
    queryFn: () => {
      if (!headerId) throw new Error('Header ID is required');
      return transferApi.getAssignedOrderLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}


