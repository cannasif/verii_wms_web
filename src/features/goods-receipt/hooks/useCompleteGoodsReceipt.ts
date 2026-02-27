import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export const useCompleteGoodsReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (headerId: number) => goodsReceiptApi.completeGoodsReceipt(headerId),
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: [GOODS_RECEIPT_QUERY_KEYS.ASSIGNED_HEADERS] });
      queryClient.invalidateQueries({ queryKey: ['collectedGrBarcodes', headerId] });
      queryClient.invalidateQueries({ queryKey: [GOODS_RECEIPT_QUERY_KEYS.ASSIGNED_ORDER_LINES, headerId] });
    },
  });
};

