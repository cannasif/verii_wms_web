import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routeId: number) => transferApi.deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectedBarcodes'] });
    },
  });
};
