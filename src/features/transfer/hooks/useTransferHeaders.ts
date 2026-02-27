import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';
import type { PagedParams } from '@/types/api';

export function useTransferHeaders() {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.HEADERS],
    queryFn: () => transferApi.getHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTransferHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.HEADERS_PAGED, params],
    queryFn: () => transferApi.getHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

