export interface TraceExplorerSummaryDto {
  auditCount: number;
  jobExecutionCount: number;
  jobFailureCount: number;
  notificationCount: number;
  integrationCount: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface TraceExplorerAuditItemDto {
  id: number;
  entityType: string;
  entityId: string;
  actionType: string;
  performedByUserId?: number;
  performedByUserEmail?: string;
  branchCode: string;
  result: string;
  source: string;
  changedFields?: string;
  reason?: string;
  oldValues?: string;
  newValues?: string;
  createdDate?: string;
}

export interface TraceExplorerJobExecutionItemDto {
  id: number;
  jobId: string;
  recurringJobId?: string;
  jobName: string;
  status: string;
  queue?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  reason?: string;
  exceptionType?: string;
  exceptionMessage?: string;
  retryCount: number;
  branchCode: string;
}

export interface TraceExplorerJobFailureItemDto {
  id: number;
  jobId: string;
  jobName: string;
  failedAt: string;
  reason?: string;
  exceptionType?: string;
  exceptionMessage?: string;
  queue?: string;
  retryCount: number;
  branchCode: string;
}

export interface TraceExplorerNotificationItemDto {
  id: number;
  title: string;
  message: string;
  channel: string;
  severity?: string;
  isRead: boolean;
  scheduledAt?: string;
  deliveredAt?: string;
  recipientUserId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  branchCode: string;
  createdDate?: string;
}

export interface TraceExplorerResponseDto {
  traceId: string;
  summary: TraceExplorerSummaryDto;
  auditLogs: TraceExplorerAuditItemDto[];
  jobExecutions: TraceExplorerJobExecutionItemDto[];
  jobFailures: TraceExplorerJobFailureItemDto[];
  notifications: TraceExplorerNotificationItemDto[];
  integrations: TraceExplorerIntegrationItemDto[];
}

export interface TraceExplorerIntegrationItemDto {
  id: number;
  integrationType: string;
  targetSystem: string;
  operation: string;
  status: string;
  source: string;
  requestMetadata?: string;
  responseMetadata?: string;
  errorMessage?: string;
  errorType?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  branchCode: string;
  createdDate?: string;
}
