import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { CreatePHeaderDto } from '../types/package';

export function useCreatePHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePHeaderDto) => packageApi.createPHeader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADERS] });
    },
  });
}

