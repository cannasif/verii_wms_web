import { useQuery } from '@tanstack/react-query';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';

export function useAllWmsScopePoliciesQuery() {
  return useQuery({
    queryKey: ['access-control', 'wms-scope-policies', 'all'],
    queryFn: async () => {
      return wmsScopePolicyApi.getAll({
        sortBy: 'Name',
        sortDirection: 'asc',
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
