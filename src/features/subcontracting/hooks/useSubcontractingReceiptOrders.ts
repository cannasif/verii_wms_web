import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSubcontractingReceiptOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: ['subcontracting-receipt-orders', customerCode],
    queryFn: () => subcontractingApi.getReceiptOrdersByCustomer(customerCode!),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};

