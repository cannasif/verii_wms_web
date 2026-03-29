import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';

export const useCollectedBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collectedShipmentBarcodes', headerId],
    queryFn: ({ signal }) => shipmentApi.getCollectedBarcodes(headerId, { signal }),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};

