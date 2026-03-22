import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function usePPackagesByHeader(packingHeaderId: number | undefined) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.PACKAGES, 'header', packingHeaderId],
    queryFn: () =>
      packingHeaderId ? packageApi.getPPackagesByHeader(packingHeaderId) : Promise.reject(createRequiredIdError('header')),
    enabled: !!packingHeaderId,
    staleTime: 2 * 60 * 1000,
  });
}

