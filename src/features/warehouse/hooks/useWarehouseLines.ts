import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import { DocumentType } from '@/types/document-type';

export function useWarehouseLines(headerId: number | null, documentType: string) {
  return useQuery({
    queryKey: ['warehouse-lines', headerId, documentType],
    queryFn: () => {
      if (!headerId) throw new Error('Header ID is required');
      if (documentType === DocumentType.WI) {
        return warehouseApi.getInboundLines(headerId);
      } else {
        return warehouseApi.getOutboundLines(headerId);
      }
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

