import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '../api/production-api';

export function useApproveProductionHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      productionApi.approveProductionHeader(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionAwaitingApprovalHeaders'] });
    },
  });
}
