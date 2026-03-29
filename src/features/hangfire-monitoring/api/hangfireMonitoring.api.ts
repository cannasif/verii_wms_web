import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  HangfireDeadLetterResponseDto,
  HangfireFailedResponseDto,
  HangfireJobItemDto,
  HangfireStatsDto,
} from '../types/hangfireMonitoring.types';

function normalizeStats(data: Record<string, unknown>): HangfireStatsDto {
  return {
    enqueued: Number(data.Enqueued ?? data.enqueued ?? 0),
    processing: Number(data.Processing ?? data.processing ?? 0),
    scheduled: Number(data.Scheduled ?? data.scheduled ?? 0),
    succeeded: Number(data.Succeeded ?? data.succeeded ?? 0),
    failed: Number(data.Failed ?? data.failed ?? 0),
    deleted: Number(data.Deleted ?? data.deleted ?? 0),
    servers: Number(data.Servers ?? data.servers ?? 0),
    queues: Number(data.Queues ?? data.queues ?? 0),
    timestamp: String(data.Timestamp ?? data.timestamp ?? new Date().toISOString()),
    lastStockSyncAt: data.LastStockSyncAt ? String(data.LastStockSyncAt) : data.lastStockSyncAt ? String(data.lastStockSyncAt) : undefined,
  };
}

function normalizeJobs(items: unknown): HangfireFailedResponseDto['items'] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      jobId: String(row.JobId ?? row.jobId ?? ''),
      jobName: String(row.JobName ?? row.jobName ?? 'unknown'),
      failedAt: row.FailedAt ? String(row.FailedAt) : undefined,
      enqueuedAt: row.EnqueuedAt ? String(row.EnqueuedAt) : undefined,
      state: String(row.State ?? row.state ?? ''),
      reason: row.Reason ? String(row.Reason) : undefined,
    };
  });
}

export const hangfireMonitoringApi = {
  async getStats(): Promise<HangfireStatsDto> {
    const response = await api.get<Record<string, unknown>>('/api/hangfire/stats');
    return normalizeStats(response ?? {});
  },

  async getFailed(from = 0, count = 20): Promise<HangfireFailedResponseDto> {
    const response = await api.get<Record<string, unknown>>(`/api/hangfire/failed?from=${from}&count=${count}`);
    return {
      items: normalizeJobs(response?.Items ?? response?.items),
      total: Number(response?.Total ?? response?.total ?? 0),
      timestamp: String(response?.Timestamp ?? response?.timestamp ?? new Date().toISOString()),
    };
  },

  async getDeadLetter(from = 0, count = 20): Promise<HangfireDeadLetterResponseDto> {
    const response = await api.get<Record<string, unknown>>(`/api/hangfire/dead-letter?from=${from}&count=${count}`);
    return {
      queue: String(response?.Queue ?? response?.queue ?? 'dead-letter'),
      enqueued: Number(response?.Enqueued ?? response?.enqueued ?? 0),
      items: normalizeJobs(response?.Items ?? response?.items),
      timestamp: String(response?.Timestamp ?? response?.timestamp ?? new Date().toISOString()),
    };
  },

  async getFailedPaged(params: PagedParams = {}): Promise<PagedResponse<HangfireJobItemDto>> {
    const response = await api.post<ApiResponse<PagedResponse<HangfireJobItemDto>>>(
      '/api/hangfire/failed/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'jobId', sortDirection: 'desc' }),
    );
    const data = response.data;
    return {
      ...(data ?? {
        data: [],
        totalCount: 0,
        pageNumber: 0,
        pageSize: 20,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      }),
      data: normalizeJobs(data?.data),
    };
  },

  async getDeadLetterPaged(params: PagedParams = {}): Promise<PagedResponse<HangfireJobItemDto>> {
    const response = await api.post<ApiResponse<PagedResponse<HangfireJobItemDto>>>(
      '/api/hangfire/dead-letter/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'jobId', sortDirection: 'desc' }),
    );
    const data = response.data;
    return {
      ...(data ?? {
        data: [],
        totalCount: 0,
        pageNumber: 0,
        pageSize: 20,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      }),
      data: normalizeJobs(data?.data),
    };
  },

  async triggerStockSync(): Promise<{ jobId: string; queue: string; enqueuedAtUtc: string }> {
    const response = await api.post<ApiResponse<{ JobId?: string; Queue?: string; EnqueuedAtUtc?: string }>>('/api/hangfire/stock-sync', {});
    return {
      jobId: String(response.data?.JobId ?? ''),
      queue: String(response.data?.Queue ?? 'default'),
      enqueuedAtUtc: String(response.data?.EnqueuedAtUtc ?? new Date().toISOString()),
    };
  },
};
