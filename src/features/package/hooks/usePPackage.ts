import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function usePPackage(id: number | undefined) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.PACKAGE, id],
    queryFn: () => (id ? packageApi.getPPackageById(id) : Promise.reject(new Error('ID is required'))),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

