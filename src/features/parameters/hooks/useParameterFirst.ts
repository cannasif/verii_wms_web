import { useQuery } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType } from '../types/parameter';

export function useParameterFirst(type: ParameterType) {
  return useQuery({
    queryKey: [PARAMETER_QUERY_KEYS.LIST(type), 'first'],
    queryFn: ({ signal }) => parameterApi.getFirst(type, { signal }),
    staleTime: 2 * 60 * 1000,
  });
}

