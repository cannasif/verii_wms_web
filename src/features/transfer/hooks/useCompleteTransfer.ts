import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';

export const useCompleteTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (headerId: number) => transferApi.completeTransfer(headerId),
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: ['assignedTransferHeaders'] });
      queryClient.invalidateQueries({ queryKey: ['collectedBarcodes', headerId] });
      queryClient.invalidateQueries({ queryKey: ['assignedTransferOrderLines', headerId] });
    },
  });
};

