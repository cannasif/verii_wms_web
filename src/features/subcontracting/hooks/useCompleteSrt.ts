import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useCompleteSrt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (headerId: number) => subcontractingApi.completeSrt(headerId),
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: ['assigned-srt-headers'] });
      queryClient.invalidateQueries({ queryKey: ['collected-srt-barcodes', headerId] });
      queryClient.invalidateQueries({ queryKey: ['assigned-srt-order-lines', headerId] });
    },
  });
};

