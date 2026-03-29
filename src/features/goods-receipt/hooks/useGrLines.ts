import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export function useGrLines(headerId: number | null) {
  return useQuery({
    queryKey: ['grLines', headerId],
    queryFn: ({ signal }) => goodsReceiptApi.getGrLines(headerId!, { signal }),
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

