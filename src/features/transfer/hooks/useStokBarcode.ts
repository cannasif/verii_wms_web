import { useQuery } from '@tanstack/react-query';
import { transferApi } from '../api/transfer-api';

export const useStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stokBarcode', barcode],
    queryFn: ({ signal }) => transferApi.getStokBarcode(barcode, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};
