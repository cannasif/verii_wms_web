import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import { useAuthStore } from '@/stores/auth-store';
import type { PagedParams } from '@/types/api';

export function useSubcontractingReceiptHeaders() {
  return useQuery({
    queryKey: ['subcontracting-receipt-headers'],
    queryFn: ({ signal }) => subcontractingApi.getReceiptHeaders({ signal }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingIssueHeaders() {
  return useQuery({
    queryKey: ['subcontracting-issue-headers'],
    queryFn: ({ signal }) => subcontractingApi.getIssueHeaders({ signal }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingReceiptHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['subcontracting-receipt-headers-paged', params],
    queryFn: ({ signal }) => subcontractingApi.getReceiptHeadersPaged(params, { signal }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingIssueHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['subcontracting-issue-headers-paged', params],
    queryFn: ({ signal }) => subcontractingApi.getIssueHeadersPaged(params, { signal }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSitHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-sit-headers', userId],
    queryFn: ({ signal }) => subcontractingApi.getAssignedSitHeaders(userId || 0, undefined, { signal }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSitHeadersPaged(params: PagedParams = {}) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-sit-headers', userId, params],
    queryFn: ({ signal }) => subcontractingApi.getAssignedSitHeaders(userId || 0, params, { signal }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSrtHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-srt-headers', userId],
    queryFn: ({ signal }) => subcontractingApi.getAssignedSrtHeaders(userId || 0, undefined, { signal }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSrtHeadersPaged(params: PagedParams = {}) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-srt-headers', userId, params],
    queryFn: ({ signal }) => subcontractingApi.getAssignedSrtHeaders(userId || 0, params, { signal }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
