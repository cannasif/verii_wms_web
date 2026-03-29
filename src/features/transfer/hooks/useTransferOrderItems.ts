import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export const useTransferOrderItems = (orderNumbers: string | undefined) => {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.ORDER_ITEMS, orderNumbers],
    queryFn: ({ signal }) => transferApi.getOrderItems(orderNumbers!, { signal }),
    enabled: !!orderNumbers,
    staleTime: 5 * 60 * 1000,
  });
};

