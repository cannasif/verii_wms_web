import { useQuery } from '@tanstack/react-query';
import { userPermissionGroupApi } from '@/features/access-control/api/userPermissionGroupApi';

const STALE_TIME_MS = 60_000;

export function useUserPermissionGroupsForForm(
  userId: number | null
): ReturnType<typeof useQuery<number[]>> {
  return useQuery({
    queryKey: ['users', userId, 'permission-groups'],
    queryFn: async (): Promise<number[]> => {
      if (userId == null) return [];
      const data = await userPermissionGroupApi.getByUserId(userId);
      return data.permissionGroupIds ?? [];
    },
    enabled: userId != null && userId > 0,
    staleTime: STALE_TIME_MS,
  });
}
