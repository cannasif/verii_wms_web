import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { productionApi } from '../api/production-api';

export function useAwaitingApprovalProductionHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['productionAwaitingApprovalHeaders', params],
    queryFn: () => productionApi.getAwaitingApprovalHeaders(params),
    staleTime: 30 * 1000,
  });
}
