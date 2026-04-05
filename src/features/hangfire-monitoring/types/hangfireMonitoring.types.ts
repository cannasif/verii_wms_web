export interface HangfireStatsDto {
  enqueued: number;
  processing: number;
  scheduled: number;
  succeeded: number;
  failed: number;
  deleted: number;
  servers: number;
  queues: number;
  timestamp: string;
  lastStockSyncAt?: string;
  manualSyncJobs: ManualSyncJobStatusDto[];
}

export interface ManualSyncJobStatusDto {
  jobKey: string;
  jobName: string;
  lastTriggeredAtUtc?: string;
  nextAvailableAtUtc?: string;
  isCoolingDown: boolean;
  cooldownSecondsRemaining: number;
}

export interface TriggerManualSyncJobResponseDto {
  jobKey: string;
  jobName: string;
  jobId: string;
  queue: string;
  enqueuedAtUtc: string;
  nextAvailableAtUtc?: string;
  cooldownSecondsRemaining: number;
}

export interface HangfireJobItemDto {
  jobId: string;
  jobName: string;
  failedAt?: string;
  enqueuedAt?: string;
  state: string;
  reason?: string;
  technicalReason?: string;
}

export interface HangfireFailedResponseDto {
  items: HangfireJobItemDto[];
  total: number;
  timestamp: string;
}

export interface HangfireDeadLetterResponseDto {
  queue: string;
  enqueued: number;
  items: HangfireJobItemDto[];
  timestamp: string;
}
