import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { UpdatePLineDto } from '../types/package';

export function useUpdatePLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePLineDto }) => packageApi.updatePLine(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINE, variables.id] });
    },
  });
}

