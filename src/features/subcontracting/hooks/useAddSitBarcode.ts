import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import type { AddBarcodeRequest } from '../types/subcontracting';

export const useAddSitBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddBarcodeRequest) => subcontractingApi.addSitBarcodeToOrder(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collected-sit-barcodes', variables.headerId] });
    },
  });
};

