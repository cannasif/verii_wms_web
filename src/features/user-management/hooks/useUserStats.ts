import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user-api';
import { queryKeys } from '../utils/query-keys';
import type { UserDto } from '../types/user-types';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisMonth: number;
  confirmedUsers: number;
}

export const useUserStats = (): ReturnType<typeof useQuery<UserStats>> => {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async (): Promise<UserStats> => {
      const allUsers = await userApi.getAll();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter((user: UserDto) => user.isActive).length;
      const newThisMonth = allUsers.filter(
        (user: UserDto) => user.creationTime && new Date(user.creationTime) >= startOfMonth
      ).length;
      const confirmedUsers = allUsers.filter((user: UserDto) => user.isEmailConfirmed).length;

      return {
        totalUsers,
        activeUsers,
        newThisMonth,
        confirmedUsers,
      };
    },
    staleTime: 60000,
  });
};
