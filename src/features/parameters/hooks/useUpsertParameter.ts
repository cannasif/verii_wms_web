import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType, CreateParameterRequest, UpdateParameterRequest } from '../types/parameter';

export function useUpsertParameter(type: ParameterType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateParameterRequest | UpdateParameterRequest) =>
      parameterApi.upsert(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARAMETER_QUERY_KEYS.LIST(type)] });
    },
  });
}

