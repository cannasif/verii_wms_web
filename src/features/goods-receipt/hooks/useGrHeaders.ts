import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { PagedParams } from '@/types/api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export function useGrHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.HEADERS, params],
    queryFn: () => goodsReceiptApi.getGrHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}
