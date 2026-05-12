import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export type { ApiResponse, PagedParams, PagedResponse };

export const TRANSFER_CHAIN_SOURCE_TYPES = {
  warehouseTransfer: 'WT',
  productionTransfer: 'PT',
  shipping: 'SH',
} as const;

export const TRANSFER_CHAIN_STATUSES = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const TRANSFER_CHAIN_STEP_STATUSES = {
  blocked: 'Blocked',
  ready: 'Ready',
  inProgress: 'InProgress',
  completed: 'Completed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
} as const;

export interface TransferChainStepDto {
  id: number;
  transferChainId: number;
  sourceType: string;
  sourceHeaderId: number;
  sequenceNo: number;
  dependencyType: string;
  isRequired: boolean;
  status: string;
  readyDate?: string | null;
  startedDate?: string | null;
  completedDate?: string | null;
  blockedReason?: string | null;
  note?: string | null;
}

export interface TransferChainDto {
  id: number;
  branchCode: string;
  code: string;
  name: string;
  chainType: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  status: string;
  description?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  steps: TransferChainStepDto[];
}

export interface TransferChainPagedRowDto {
  id: number;
  branchCode: string;
  code: string;
  name: string;
  chainType: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  status: string;
  stepCount: number;
  completedStepCount: number;
  createdDate?: string | null;
}

export interface CreateTransferChainStepDto {
  sourceType: string;
  sourceHeaderId: number;
  sequenceNo: number;
  dependencyType?: string;
  isRequired: boolean;
  note?: string;
}

export interface UpdateTransferChainStepDto {
  sequenceNo?: number;
  dependencyType?: string;
  isRequired?: boolean;
  status?: string;
  blockedReason?: string | null;
  note?: string | null;
}

export interface CreateTransferChainDto {
  branchCode?: string;
  code: string;
  name: string;
  chainType?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  status?: string;
  description?: string;
  steps: CreateTransferChainStepDto[];
}

export interface UpdateTransferChainDto {
  name?: string;
  chainType?: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  status?: string;
  description?: string | null;
}

export interface TransferChainBlockingStepDto {
  stepId: number;
  sourceType: string;
  sourceHeaderId: number;
  sequenceNo: number;
  status: string;
}

export interface TransferChainReadinessDto {
  sourceType: string;
  sourceHeaderId: number;
  isChained: boolean;
  canStart: boolean;
  transferChainId?: number | null;
  transferChainCode?: string | null;
  stepId?: number | null;
  sequenceNo?: number | null;
  status?: string | null;
  blockedReason?: string | null;
  blockingSteps: TransferChainBlockingStepDto[];
}
