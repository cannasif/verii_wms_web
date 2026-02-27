import { useQuery } from '@tanstack/react-query';
import { userAuthorityApi } from '../api/user-authority-api';

const STALE_TIME_MS = 5 * 60 * 1000;

export interface RoleOption {
  value: number;
  label: string;
}

export function useUserAuthorityOptionsQuery(): ReturnType<
  typeof useQuery<RoleOption[]>
> {
  return useQuery({
    queryKey: ['user-authority', 'options'],
    queryFn: async (): Promise<RoleOption[]> => {
      const response = await userAuthorityApi.getList();
      return response.map((r) => ({
        value: r.id,
        label: r.title,
      }));
    },
    staleTime: STALE_TIME_MS,
  });
}
