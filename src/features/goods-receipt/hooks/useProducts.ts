import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export function useProducts() {
  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.PRODUCTS],
    queryFn: () => goodsReceiptApi.getProducts(),
    staleTime: 2 * 60 * 60 * 1000,
  });
}
