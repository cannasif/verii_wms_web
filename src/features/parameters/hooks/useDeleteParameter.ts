import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterApi } from '../api/parameter-api';
import { PARAMETER_QUERY_KEYS } from '../utils/query-keys';
import type { ParameterType } from '../types/parameter';

export function useDeleteParameter(type: ParameterType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => parameterApi.delete(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARAMETER_QUERY_KEYS.LIST(type)] });
    },
  });
}

