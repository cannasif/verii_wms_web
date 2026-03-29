import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export function useTransferLineSerials(lineId: number | null) {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.LINE_SERIALS, lineId],
    queryFn: ({ signal }) => {
      if (!lineId) throw createRequiredIdError('line');
      return transferApi.getLineSerials(lineId, { signal });
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}
