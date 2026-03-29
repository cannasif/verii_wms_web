import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSrtStokBarcode = (barcode: string, barcodeGroup: string = '1', enabled: boolean = false) => {
  return useQuery({
    queryKey: ['srt-stok-barcode', barcode, barcodeGroup],
    queryFn: ({ signal }) => subcontractingApi.getStokBarcode(barcode, barcodeGroup, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

