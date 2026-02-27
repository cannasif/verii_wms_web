import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { AddBarcodeRequest } from '../types/goods-receipt';

export const useAddGrBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddBarcodeRequest) => goodsReceiptApi.addBarcodeToOrder(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collectedGrBarcodes', variables.headerId] });
    },
  });
};

