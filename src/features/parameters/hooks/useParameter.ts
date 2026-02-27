import { useQuery } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType } from '../types/parameter';

export function useParameter(type: ParameterType, id: number | null) {
  return useQuery({
    queryKey: [PARAMETER_QUERY_KEYS.DETAIL(type, id || 0)],
    queryFn: () => (id ? parameterApi.getById(type, id) : Promise.reject(new Error('ID is required'))),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

