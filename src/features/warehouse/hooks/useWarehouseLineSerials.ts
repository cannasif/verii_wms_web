import { createRequiredIdError } from '@/lib/localized-error';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import { DocumentType } from '@/types/document-type';

export function useWarehouseLineSerials(lineId: number | null, documentType: string) {
  return useQuery({
    queryKey: ['warehouse-line-serials', lineId, documentType],
    queryFn: ({ signal }) => {
      if (!lineId) throw createRequiredIdError('line');
      if (documentType === DocumentType.WI) {
        return warehouseApi.getInboundLineSerials(lineId, { signal });
      } else {
        return warehouseApi.getOutboundLineSerials(lineId, { signal });
      }
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}
