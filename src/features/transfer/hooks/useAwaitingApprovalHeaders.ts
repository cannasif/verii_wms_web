import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';
import type { PagedParams } from '@/types/api';

export function useAwaitingApprovalHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.AWAITING_APPROVAL_HEADERS, params],
    queryFn: () => transferApi.getAwaitingApprovalHeaders(params),
    staleTime: 30 * 1000,
  });
}

