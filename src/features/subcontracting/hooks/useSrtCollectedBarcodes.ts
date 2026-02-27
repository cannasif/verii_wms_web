import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSrtCollectedBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collected-srt-barcodes', headerId],
    queryFn: () => subcontractingApi.getSrtCollectedBarcodes(headerId),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};

