import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalSitHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['awaiting-approval-sit-headers', params],
    queryFn: () => subcontractingApi.getAwaitingApprovalSitHeaders(params),
    staleTime: 30 * 1000,
  });
}

