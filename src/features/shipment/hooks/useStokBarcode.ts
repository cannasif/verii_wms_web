import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';

export const useStokBarcode = (barcode: string, barcodeGroup: string = '1', enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stokBarcode', barcode, barcodeGroup],
    queryFn: () => shipmentApi.getStokBarcode(barcode, barcodeGroup),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

