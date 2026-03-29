import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSitCollectedBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collected-sit-barcodes', headerId],
    queryFn: ({ signal }) => subcontractingApi.getSitCollectedBarcodes(headerId, { signal }),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};

