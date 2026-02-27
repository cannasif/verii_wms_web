import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { CreatePPackageDto } from '../types/package';

export function useCreatePPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePPackageDto) => packageApi.createPPackage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.PACKAGES] });
      queryClient.invalidateQueries({ 
        queryKey: [PACKAGE_QUERY_KEYS.PACKAGES, 'header', variables.packingHeaderId] 
      });
      queryClient.refetchQueries({ 
        queryKey: [PACKAGE_QUERY_KEYS.PACKAGES, 'header', variables.packingHeaderId] 
      });
    },
  });
}

