import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { TraceExplorerResponseDto } from '../types/traceExplorer.types';

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export const traceExplorerApi = {
  async getByTraceId(traceId: string): Promise<TraceExplorerResponseDto> {
    const response = await api.get<ApiResponse<TraceExplorerResponseDto>>(`/api/trace-explorer/${encodeURIComponent(traceId)}`);
    const data = response.data;
    return {
      traceId: String(data?.traceId ?? traceId),
      summary: {
        auditCount: Number(data?.summary?.auditCount ?? 0),
        jobExecutionCount: Number(data?.summary?.jobExecutionCount ?? 0),
        jobFailureCount: Number(data?.summary?.jobFailureCount ?? 0),
        notificationCount: Number(data?.summary?.notificationCount ?? 0),
        integrationCount: Number(data?.summary?.integrationCount ?? 0),
        firstSeenAt: data?.summary?.firstSeenAt,
        lastSeenAt: data?.summary?.lastSeenAt,
      },
      auditLogs: normalizeArray(data?.auditLogs),
      jobExecutions: normalizeArray(data?.jobExecutions),
      jobFailures: normalizeArray(data?.jobFailures),
      notifications: normalizeArray(data?.notifications),
      integrations: normalizeArray(data?.integrations),
    };
  },
};
