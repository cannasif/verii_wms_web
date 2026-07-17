import { useQuery } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';
import type { PagedRequest } from '../types/access-control.types';

const STALE_TIME_MS = 30_000;

export const usePermissionGroupsQuery = (params: PagedRequest, loadAll = false) =>
  useQuery({
    queryKey: [...ACCESS_CONTROL_QUERY_KEYS.PERMISSION_GROUPS(params), { loadAll }],
    queryFn: () => loadAll ? permissionGroupApi.getAll(params) : permissionGroupApi.getList(params),
    staleTime: STALE_TIME_MS,
  });
