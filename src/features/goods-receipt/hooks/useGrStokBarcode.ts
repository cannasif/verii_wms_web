import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export const useGrStokBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['grStokBarcode', barcode],
    queryFn: ({ signal }) => goodsReceiptApi.getStokBarcode(barcode, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

