import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { queryKeys } from '../utils/query-keys';

export const useActiveUsers = () => {
  return useQuery({
    queryKey: queryKeys.activeUsers(),
    queryFn: async () => {
      const response = await authApi.getActiveUsers();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Aktif kullanıcılar yüklenemedi');
    },
    staleTime: 5 * 60 * 1000,
  });
};

