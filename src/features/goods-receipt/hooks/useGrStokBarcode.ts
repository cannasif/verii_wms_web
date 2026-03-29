import { useQuery } from '@tanstack/react-query';
import { goodsReceiptApi } from '../api/goods-receipt-api';

export const useGrStokBarcode = (barcode: string, barcodeGroup: string = '1', enabled: boolean = false) => {
  return useQuery({
    queryKey: ['grStokBarcode', barcode, barcodeGroup],
    queryFn: ({ signal }) => goodsReceiptApi.getStokBarcode(barcode, barcodeGroup, { signal }),
    enabled: enabled && !!barcode,
    staleTime: 0,
    gcTime: 0,
  });
};

