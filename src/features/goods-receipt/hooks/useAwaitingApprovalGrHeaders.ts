import { useQuery } from '@tanstack/react-query';
import type { PagedParams } from '@/types/api';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export function useAwaitingApprovalGrHeaders(params: PagedParams = {}) {
  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.AWAITING_APPROVAL_HEADERS, params],
    queryFn: ({ signal }) => goodsReceiptApi.getAwaitingApprovalHeaders(params, { signal }),
    staleTime: 30 * 1000,
  });
}
