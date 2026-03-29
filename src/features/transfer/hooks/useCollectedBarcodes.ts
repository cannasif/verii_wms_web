import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';

export const useCollectedBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collectedBarcodes', headerId],
    queryFn: ({ signal }) => transferApi.getCollectedBarcodes(headerId, { signal }),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};
