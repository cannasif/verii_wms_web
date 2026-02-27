import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import { DocumentType } from '@/types/document-type';

export function useWarehouseLineSerials(lineId: number | null, documentType: string) {
  return useQuery({
    queryKey: ['warehouse-line-serials', lineId, documentType],
    queryFn: () => {
      if (!lineId) throw new Error('Line ID is required');
      if (documentType === DocumentType.WI) {
        return warehouseApi.getInboundLineSerials(lineId);
      } else {
        return warehouseApi.getOutboundLineSerials(lineId);
      }
    },
    enabled: !!lineId,
    staleTime: 2 * 60 * 1000,
  });
}

