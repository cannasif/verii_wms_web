import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { UpdatePHeaderDto } from '../types/package';

export function useUpdatePHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePHeaderDto }) => packageApi.updatePHeader(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADERS] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADER, variables.id] });
    },
  });
}

