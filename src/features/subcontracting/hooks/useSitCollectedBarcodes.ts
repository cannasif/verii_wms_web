import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSitCollectedBarcodes = (headerId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['collected-sit-barcodes', headerId],
    queryFn: () => subcontractingApi.getSitCollectedBarcodes(headerId),
    enabled: enabled && !!headerId,
    staleTime: 30000,
  });
};

