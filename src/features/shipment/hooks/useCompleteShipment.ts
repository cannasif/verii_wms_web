import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export const useCompleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (headerId: number) => shipmentApi.completeShipment(headerId),
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_HEADERS] });
      queryClient.invalidateQueries({ queryKey: ['collectedShipmentBarcodes', headerId] });
      queryClient.invalidateQueries({ queryKey: [SHIPMENT_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId] });
    },
  });
};

