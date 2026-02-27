import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export function useAssignedGrHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [GOODS_RECEIPT_QUERY_KEYS.ASSIGNED_HEADERS, userId],
    queryFn: () => goodsReceiptApi.getAssignedHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

