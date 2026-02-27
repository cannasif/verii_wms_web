import { useQuery } from '@tanstack/react-query';
import { subcontractingApi } from '../api/subcontracting-api';
import { useAuthStore } from '@/stores/auth-store';
import type { PagedParams } from '@/types/api';

export function useSubcontractingReceiptHeaders() {
  return useQuery({
    queryKey: ['subcontracting-receipt-headers'],
    queryFn: () => subcontractingApi.getReceiptHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingIssueHeaders() {
  return useQuery({
    queryKey: ['subcontracting-issue-headers'],
    queryFn: () => subcontractingApi.getIssueHeaders(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingReceiptHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['subcontracting-receipt-headers-paged', params],
    queryFn: () => subcontractingApi.getReceiptHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubcontractingIssueHeadersPaged(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['subcontracting-issue-headers-paged', params],
    queryFn: () => subcontractingApi.getIssueHeadersPaged(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSitHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-sit-headers', userId],
    queryFn: () => subcontractingApi.getAssignedSitHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignedSrtHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['assigned-srt-headers', userId],
    queryFn: () => subcontractingApi.getAssignedSrtHeaders(userId || 0),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

