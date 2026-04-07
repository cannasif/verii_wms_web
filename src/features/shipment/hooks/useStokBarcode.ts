import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../api/shipment-api';

export const useStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stokBarcode', barcode],
    queryFn: ({ signal }) => shipmentApi.getStokBarcode(barcode, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

