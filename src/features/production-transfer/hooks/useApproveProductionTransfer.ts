import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionTransferApi } from '../api/production-transfer-api';

export function useApproveProductionTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      productionTransferApi.approveProductionTransfer(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionTransferAwaitingApprovalHeaders'] });
    },
  });
}
