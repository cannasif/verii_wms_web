import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { GOODS_RECEIPT_QUERY_KEYS } from '../utils/query-keys';

export function useApproveGrHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      goodsReceiptApi.approveGoodsReceipt(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOODS_RECEIPT_QUERY_KEYS.AWAITING_APPROVAL_HEADERS] });
    },
  });
}
