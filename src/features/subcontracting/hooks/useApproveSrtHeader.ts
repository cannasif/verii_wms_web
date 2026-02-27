import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export function useApproveSrtHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      subcontractingApi.approveSrtHeader(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awaiting-approval-srt-headers'] });
    },
  });
}

