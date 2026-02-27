import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';

export function useMatchPlines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pHeaderId, isMatched }: { pHeaderId: number; isMatched: boolean }) =>
      packageApi.matchPlines(pHeaderId, isMatched),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADERS] });
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.HEADER, variables.pHeaderId] });
    },
  });
}

