import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function useDeletePPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => packageApi.deletePPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGES] });
    },
  });
}

