import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalSrtHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['awaiting-approval-srt-headers', params],
    queryFn: () => subcontractingApi.getAwaitingApprovalSrtHeaders(params),
    staleTime: 30 * 1000,
  });
}

