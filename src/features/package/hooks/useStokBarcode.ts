import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/package-api';

export const useStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stokBarcode', barcode],
    queryFn: () => packageApi.getStokBarcode(barcode),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};
