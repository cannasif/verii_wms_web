import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouse-api';
import { WAREHOUSE_QUERY_KEYS } from '../utils/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import type { WarehouseHeadersResponse, WarehouseHeader } from '../types/warehouse';
import type { PagedParams, PagedResponse } from '@/types/api';

export function useWarehouseInboundHeaders(): UseQueryResult<WarehouseHeadersResponse> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.INBOUND_HEADERS],
    queryFn: () => warehouseApi.getInboundHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWarehouseOutboundHeaders(): UseQueryResult<WarehouseHeadersResponse> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.OUTBOUND_HEADERS],
    queryFn: () => warehouseApi.getOutboundHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWarehouseInboundHeadersPaged(params: PagedParams = {}): UseQueryResult<PagedResponse<WarehouseHeader>> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.INBOUND_HEADERS_PAGED, params],
    queryFn: () => warehouseApi.getInboundHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWarehouseOutboundHeadersPaged(params: PagedParams = {}): UseQueryResult<PagedResponse<WarehouseHeader>> {
  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.OUTBOUND_HEADERS_PAGED, params],
    queryFn: () => warehouseApi.getOutboundHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedWarehouseInboundHeaders(): UseQueryResult<WarehouseHeadersResponse> {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.ASSIGNED_INBOUND_HEADERS, userId],
    queryFn: () => warehouseApi.getAssignedInboundHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedWarehouseOutboundHeaders(): UseQueryResult<WarehouseHeadersResponse> {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [WAREHOUSE_QUERY_KEYS.ASSIGNED_OUTBOUND_HEADERS, userId],
    queryFn: () => warehouseApi.getAssignedOutboundHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

