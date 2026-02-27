import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import type { PagedParams } from '@/types/api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function usePHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.HEADERS, params],
    queryFn: () => packageApi.getPHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

