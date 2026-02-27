import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useCompleteSit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (headerId: number) => subcontractingApi.completeSit(headerId),
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: ['assigned-sit-headers'] });
      queryClient.invalidateQueries({ queryKey: ['collected-sit-barcodes', headerId] });
      queryClient.invalidateQueries({ queryKey: ['assigned-sit-order-lines', headerId] });
    },
  });
};

