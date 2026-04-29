import type {
  CreateKkdDistributionSubmissionLineDto,
  KkdEntitlementCheckResultDto,
} from '../../types/kkd.types';

export type LocalDistributionLine = CreateKkdDistributionSubmissionLineDto & {
  clientId: string;
  stockCode: string;
  stockName: string;
  groupCode?: string | null;
  groupName?: string | null;
  entitlement: KkdEntitlementCheckResultDto;
  openOrderPendingQuantity: number;
  openOrderDocumentNos: string;
  entitledQuantity: number;
  excessQuantity: number;
  isExcessIssue: boolean;
};

export const formatGroupLabel = (groupCode?: string | null, groupName?: string | null): string =>
  [groupCode, groupName].filter(Boolean).join(' - ');
