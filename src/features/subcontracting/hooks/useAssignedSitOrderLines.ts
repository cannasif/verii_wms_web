import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export function useAssignedSitOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: ['assigned-sit-order-lines', headerId],
    queryFn: ({ signal }) => {
      if (!headerId) throw createRequiredIdError('header');
      return subcontractingApi.getAssignedSitOrderLines(headerId, { signal });
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}
