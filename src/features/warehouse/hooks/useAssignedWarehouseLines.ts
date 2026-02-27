import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import { WAREHOUSE_QUERY_KEYS } from '../utils/query-keys';
import type { WarehouseLinesResponse } from '../types/warehouse';

export function useAssignedWarehouseInboundLines(headerId: number | null): UseQueryResult<WarehouseLinesResponse> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.ASSIGNED_INBOUND_LINES, headerId],
    queryFn: () => {
      if (!headerId) {
        throw new Error('Header ID is required');
      }
      return warehouseApi.getAssignedInboundLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedWarehouseOutboundLines(headerId: number | null): UseQueryResult<WarehouseLinesResponse> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.ASSIGNED_OUTBOUND_LINES, headerId],
    queryFn: () => {
      if (!headerId) {
        throw new Error('Header ID is required');
      }
      return warehouseApi.getAssignedOutboundLines(headerId);
    },
    enabled: !!headerId,
    staleTime: 2 * 60 * 1000,
  });
}


