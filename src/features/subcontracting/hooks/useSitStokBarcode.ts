import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSitStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['sit-stok-barcode', barcode],
    queryFn: ({ signal }) => subcontractingApi.getStokBarcode('subcontracting-issue-assigned', barcode, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

