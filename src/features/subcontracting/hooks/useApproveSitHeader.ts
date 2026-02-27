import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export function useApproveSitHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      subcontractingApi.approveSitHeader(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awaiting-approval-sit-headers'] });
    },
  });
}

