import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export function useGrImportLinesWithRoutes(headerId: number | null) {
  return useQuery({
    queryKey: ['grImportLinesWithRoutes', headerId],
    queryFn: ({ signal }) => goodsReceiptApi.getGrImportLinesWithRoutes(headerId!, { signal }),
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

