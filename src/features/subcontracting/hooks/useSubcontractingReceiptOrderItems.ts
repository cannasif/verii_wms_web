import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSubcontractingReceiptOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: ['subcontracting-receipt-order-items', orderNumbers],
    queryFn: () => subcontractingApi.getReceiptOrderItems(orderNumbers!),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

