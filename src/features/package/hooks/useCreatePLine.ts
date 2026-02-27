import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type { CreatePLineDto } from '../types/package';

export function useCreatePLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePLineDto) => packageApi.createPLine(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES, 'header', variables.packingHeaderId] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.LINES, 'package', variables.packageId] });
    },
  });
}

