import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';
import { TRANSFER_QUERY_KEYS } from '../utils/query-keys';

export function useTransferLineSerials(lineId: number | null) {
  return useQuery({
    queryKey: [TRANSFER_QUERY_KEYS.LINE_SERIALS, lineId],
    queryFn: () => {
      if (!lineId) throw new Error('Line ID is required');
      return transferApi.getLineSerials(lineId);
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}

