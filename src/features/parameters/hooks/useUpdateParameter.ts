import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType, UpdateParameterRequest } from '../types/parameter';

export function useUpdateParameter(type: ParameterType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateParameterRequest }) =>
      parameterApi.update(type, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PARAMETER_QUERY_KEYS.LIST(type)] });
      queryClient.invalidateQueries({ queryKey: [PARAMETER_QUERY_KEYS.DETAIL(type, variables.id)] });
    },
  });
}

