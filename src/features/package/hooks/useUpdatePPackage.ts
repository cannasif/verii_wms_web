import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { UpdatePPackageDto } from '../types/package';

export function useUpdatePPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePPackageDto }) => packageApi.updatePPackage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGES] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGE, variables.id] });
    },
  });
}

