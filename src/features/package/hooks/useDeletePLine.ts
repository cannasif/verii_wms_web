import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function useDeletePLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => packageApi.deletePLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES] });
    },
  });
}

