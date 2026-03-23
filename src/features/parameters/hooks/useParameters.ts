import { useQuery } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType } from '../types/parameter';
import type { PagedParams } from '@/types/api';

export function useParameters(type: ParameterType) {
  return useQuery({
    queryKey: [PARAMETER_QUERY_KEYS.LIST(type)],
    queryFn: () => parameterApi.getAll(type),
    staleTime: 2 * 60 * 1000,
  });
}

export function useParametersPaged(type: ParameterType, params: PagedParams = {}) {
  return useQuery({
    queryKey: [PARAMETER_QUERY_KEYS.LIST(type), params],
    queryFn: () => parameterApi.getPaged(type, params),
    staleTime: 2 * 60 * 1000,
  });
}
