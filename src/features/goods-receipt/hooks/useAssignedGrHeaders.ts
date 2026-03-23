import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import type { PagedParams } from '@/types/api';

export function useAssignedGrHeaders(params: PagedParams = {}) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.ASSIGNED_HEADERS, userId, params],
    queryFn: () => goodsReceiptApi.getAssignedHeaders(userId || 0, params),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
