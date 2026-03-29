import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';

export const useStokBarcode = (barcode: string, barcodeGroup: string = '1', enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stokBarcode', barcode, barcodeGroup],
    queryFn: ({ signal }) => transferApi.getStokBarcode(barcode, barcodeGroup, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};
