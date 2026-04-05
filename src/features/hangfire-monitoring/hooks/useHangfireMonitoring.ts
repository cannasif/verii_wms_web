import { useQuery } from '@tanstack/react-query';
import { hangfireMonitoringApi } from '../api/hangfireMonitoring.api';
import type { PagedParams } from '@/types/api';

const REFRESH_INTERVAL_MS = 60_000;

export const HANGFIRE_QUERY_KEYS = {
  STATS: ['hangfire', 'stats'] as const,
  MANUAL_SYNC_JOBS: ['hangfire', 'manual-sync-jobs'] as const,
  FAILED: (from: number, count: number) => ['hangfire', 'failed', from, count] as const,
  DEAD_LETTER: (from: number, count: number) => ['hangfire', 'dead-letter', from, count] as const,
};

export function useHangfireStatsQuery() {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.STATS,
    queryFn: () => hangfireMonitoringApi.getStats(),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireFailedJobsQuery(from: number, count: number) {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.FAILED(from, count),
    queryFn: () => hangfireMonitoringApi.getFailed(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireManualSyncJobsQuery() {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.MANUAL_SYNC_JOBS,
    queryFn: () => hangfireMonitoringApi.getManualSyncJobs(),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireDeadLetterQuery(from: number, count: number) {
  return useQuery({
    queryKey: HANGFIRE_QUERY_KEYS.DEAD_LETTER(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
    queryFn: () => hangfireMonitoringApi.getDeadLetter(from, count),
    refetchIntervalInBackground: false,
  });
}

export function useHangfireFailedPagedQuery(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['hangfire', 'failed-paged', params],
    queryFn: () => hangfireMonitoringApi.getFailedPaged(params),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireDeadLetterPagedQuery(params: PagedParams = {}) {
  return useQuery({
    queryKey: ['hangfire', 'dead-letter-paged', params],
    queryFn: () => hangfireMonitoringApi.getDeadLetterPaged(params),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
