import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export const useTransferOrders = (customerCode: string | undefined) => {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.ORDERS, customerCode],
    queryFn: () => transferApi.getOrdersByCustomer(customerCode!),
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
};

