import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export function useAssignedSitOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: ['assigned-sit-order-lines', headerId],
    queryFn: () => {
      if (!headerId) throw new Error('Header ID is required');
      return subcontractingApi.getAssignedSitOrderLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

