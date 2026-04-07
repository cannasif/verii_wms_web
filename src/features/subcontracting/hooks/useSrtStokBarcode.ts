import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSrtStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['srt-stok-barcode', barcode],
    queryFn: ({ signal }) => subcontractingApi.getStokBarcode('subcontracting-receipt-assigned', barcode, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

