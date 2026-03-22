import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function usePLinesByHeader(packingHeaderId: number | undefined) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.LINES, 'header', packingHeaderId],
    queryFn: () =>
      packingHeaderId ? packageApi.getPLinesByHeader(packingHeaderId) : Promise.reject(createRequiredIdError('header')),
    enabled: !!packingHeaderId,
    staleTime: 2 * 60 * 1000,
  });
}

