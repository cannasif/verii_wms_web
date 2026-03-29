import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export function useGrHeaderDetail(id: number | null) {
  return useQuery({
    queryKey: ['grHeader', id],
    queryFn: ({ signal }) => goodsReceiptApi.getGrHeaderById(id!, { signal }),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

