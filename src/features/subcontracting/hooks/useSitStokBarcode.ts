import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';

export const useSitStokBarcode = (barcode: string, barcodeGroup: string = '1', enabled: boolean = false) => {
  return useQuery({
    queryKey: ['sit-stok-barcode', barcode, barcodeGroup],
    queryFn: () => subcontractingApi.getStokBarcode(barcode, barcodeGroup),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

