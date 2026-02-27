import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export const useCollectedGrBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collectedGrBarcodes', headerId],
    queryFn: () => goodsReceiptApi.getCollectedBarcodes(headerId),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};

