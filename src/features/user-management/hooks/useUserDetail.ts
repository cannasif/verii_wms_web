import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user-api';
import { queryKeys } from '../utils/query-keys';
import type { UserDto } from '../types/user-types';

export const useUserDetail = (
  id: number | null
): ReturnType<typeof useQuery<UserDto>> => {
  return useQuery({
    queryKey: queryKeys.detail(id ?? 0),
    queryFn: () => userApi.getById(id!),
    enabled: id !== null && id > 0,
    staleTime: 60000,
  });
};
