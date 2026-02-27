import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { AddBarcodeRequest } from '../types/subcontracting';

export const useAddSrtBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddBarcodeRequest) => subcontractingApi.addSrtBarcodeToOrder(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collected-srt-barcodes', variables.headerId] });
    },
  });
};

