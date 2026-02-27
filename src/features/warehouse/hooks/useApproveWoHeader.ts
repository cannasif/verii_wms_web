import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';

export function useApproveWoHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      warehouseApi.approveWoHeader(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awaiting-approval-wo-headers'] });
    },
  });
}

