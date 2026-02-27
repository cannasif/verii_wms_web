import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export function useAssignedGrOrderLines(headerId: number | null) {
  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId],
    queryFn: () => {
      if (!headerId) throw new Error('Header ID is required');
      return goodsReceiptApi.getAssignedOrderLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

