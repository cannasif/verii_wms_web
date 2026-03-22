import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export function useAssignedSrtOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: ['assigned-srt-order-lines', headerId],
    queryFn: () => {
      if (!headerId) throw createRequiredIdError('header');
      return subcontractingApi.getAssignedSrtOrderLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

