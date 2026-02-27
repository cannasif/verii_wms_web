import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function usePLinesByPackage(packageId: number | undefined) {
  return useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.LINES, 'package', packageId],
    queryFn: () => (packageId ? packageApi.getPLinesByPackage(packageId) : Promise.reject(new Error('Package ID is required'))),
    enabled: !!packageId,
    staleTime: 2 * 60 * 1000,
  });
}

