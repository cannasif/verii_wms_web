import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export function useApproveTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      transferApi.approveTransfer(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSFER_QUERY_KEYS.AWAITING_APPROVAL_HEADERS] });
    },
  });
}

