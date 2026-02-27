import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';
import { SHIPMENT_QUERY_KEYS } from '../utils/query-keys';

export function useApproveShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      shipmentApi.approveShipment(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIPMENT_QUERY_KEYS.AWAITING_APPROVAL_HEADERS] });
    },
  });
}

