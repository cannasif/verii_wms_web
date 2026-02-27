import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalWiHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['awaiting-approval-wi-headers', params],
    queryFn: () => warehouseApi.getAwaitingApprovalWiHeaders(params),
    staleTime: 30 * 1000,
  });
}

