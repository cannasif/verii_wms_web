import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import type { AddBarcodeRequest } from '../types/shipment';

export const useAddBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddBarcodeRequest) => shipmentApi.addBarcodeToOrder(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collectedShipmentBarcodes', variables.headerId] });
    },
  });
};

