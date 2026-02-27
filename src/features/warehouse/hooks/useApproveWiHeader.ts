import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export function useApproveWiHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      warehouseApi.approveWiHeader(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awaiting-approval-wi-headers'] });
    },
  });
}

