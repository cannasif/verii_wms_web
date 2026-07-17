import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { queryKeys } from '../utils/query-keys';

export const useActiveUsers = () => {
  return useQuery({
    queryKey: queryKeys.activeUsers(),
    queryFn: async ({ signal }) => authApi.getActiveUsers({ signal }),
    staleTime: 5 * 60 * 1000,
  });
};
