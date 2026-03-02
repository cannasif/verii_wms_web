import { useQuery } from '@tanstack/react-query';
import { permissionGroupApi } from '@/features/access-control/api/permissionGroupApi';

const STALE_TIME_MS = 5 * 60 * 1000;

export interface PermissionGroupOption {
  value: number;
  label: string;
  isSystemAdmin?: boolean;
}

export function usePermissionGroupOptionsQuery(): ReturnType<
  typeof useQuery<PermissionGroupOption[]>
> {
  return useQuery({
    queryKey: ['permission-groups', 'options'],
    queryFn: async (): Promise<PermissionGroupOption[]> => {
      const response = await permissionGroupApi.getList({
        pageNumber: 1,
        pageSize: 200,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      return (response.data ?? [])
        .filter((g) => g.isActive)
        .map((g) => ({
          value: g.id,
          label: g.name,
          isSystemAdmin: g.isSystemAdmin,
        }));
    },
    staleTime: STALE_TIME_MS,
  });
}
