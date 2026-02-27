import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import type { AddBarcodeRequest } from '../types/transfer';

export const useAddBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddBarcodeRequest) => transferApi.addBarcodeToOrder(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collectedBarcodes', variables.headerId] });
    },
  });
};
