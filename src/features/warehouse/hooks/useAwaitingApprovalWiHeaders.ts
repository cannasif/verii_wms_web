import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalWiHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['awaiting-approval-wi-headers', params],
    queryFn: ({ signal }) => warehouseApi.getAwaitingApprovalWiHeaders(params, { signal }),
    staleTime: 30 * 1000,
  });
}

