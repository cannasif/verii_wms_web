import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export function useGrLines(headerId: number | null) {
  return useQuery({
    queryKey: ['grLines', headerId],
    queryFn: () => goodsReceiptApi.getGrLines(headerId!),
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

