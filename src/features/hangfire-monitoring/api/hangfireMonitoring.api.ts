import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  HangfireDeadLetterResponseDto,
  HangfireFailedResponseDto,
  HangfireJobItemDto,
  HangfireStatsDto,
  ManualSyncJobStatusDto,
  TriggerManualSyncJobResponseDto,
} from '../types/hangfireMonitoring.types';

function normalizeManualSyncJobs(items: unknown): ManualSyncJobStatusDto[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      jobKey: String(row.JobKey ?? row.jobKey ?? ''),
      jobName: String(row.JobName ?? row.jobName ?? ''),
      lastTriggeredAtUtc: row.LastTriggeredAtUtc ? String(row.LastTriggeredAtUtc) : row.lastTriggeredAtUtc ? String(row.lastTriggeredAtUtc) : undefined,
      nextAvailableAtUtc: row.NextAvailableAtUtc ? String(row.NextAvailableAtUtc) : row.nextAvailableAtUtc ? String(row.nextAvailableAtUtc) : undefined,
      isCoolingDown: Boolean(row.IsCoolingDown ?? row.isCoolingDown ?? false),
      cooldownSecondsRemaining: Number(row.CooldownSecondsRemaining ?? row.cooldownSecondsRemaining ?? 0),
    };
  });
}

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
    manualSyncJobs: normalizeManualSyncJobs(data.ManualSyncJobs ?? data.manualSyncJobs),
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
      technicalReason: row.TechnicalReason ? String(row.TechnicalReason) : row.technicalReason ? String(row.technicalReason) : undefined,
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

  async getManualSyncJobs(): Promise<ManualSyncJobStatusDto[]> {
    const response = await api.get<ApiResponse<ManualSyncJobStatusDto[]>>('/api/hangfire/manual-sync/jobs');
    return normalizeManualSyncJobs(response.data);
  },

  async triggerManualSync(jobKey: string): Promise<TriggerManualSyncJobResponseDto> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>('/api/hangfire/manual-sync/run', { jobKey });
    return {
      jobKey: String(response.data?.JobKey ?? response.data?.jobKey ?? ''),
      jobName: String(response.data?.JobName ?? response.data?.jobName ?? ''),
      jobId: String(response.data?.JobId ?? response.data?.jobId ?? ''),
      queue: String(response.data?.Queue ?? response.data?.queue ?? 'default'),
      enqueuedAtUtc: String(response.data?.EnqueuedAtUtc ?? response.data?.enqueuedAtUtc ?? new Date().toISOString()),
      nextAvailableAtUtc: response.data?.NextAvailableAtUtc ? String(response.data.NextAvailableAtUtc) : response.data?.nextAvailableAtUtc ? String(response.data.nextAvailableAtUtc) : undefined,
      cooldownSecondsRemaining: Number(response.data?.CooldownSecondsRemaining ?? response.data?.cooldownSecondsRemaining ?? 0),
    };
  },
};
