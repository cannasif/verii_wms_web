import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { productionTransferApi } from '../api/production-transfer-api';

export function useAwaitingApprovalProductionTransferHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['productionTransferAwaitingApprovalHeaders', params],
    queryFn: () => productionTransferApi.getAwaitingApprovalHeaders(params),
    staleTime: 30 * 1000,
  });
}
