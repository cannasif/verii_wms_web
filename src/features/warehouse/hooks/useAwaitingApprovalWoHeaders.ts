import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalWoHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['awaiting-approval-wo-headers', params],
    queryFn: () => warehouseApi.getAwaitingApprovalWoHeaders(params),
    staleTime: 30 * 1000,
  });
}

