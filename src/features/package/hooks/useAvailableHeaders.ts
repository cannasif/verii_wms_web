import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function useAvailableHeaders(sourceType: string | undefined) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.AVAILABLE_HEADERS, sourceType],
    queryFn: () => packageApi.getAvailableHeadersForMapping(sourceType!),
    enabled: !!sourceType,
    staleTime: 30000,
  });
}

