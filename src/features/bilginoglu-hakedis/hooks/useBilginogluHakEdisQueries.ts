import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { bilginogluHakEdisApi } from '../api/bilginogluHakEdisApi';
import type { PagedParams, UpsertBilginogluHakEdisCompletedLocationSetting, UpsertBilginogluHakEdisOperationSetting, UpdateBilginogluHakEdisOrderPolicy } from '../types/bilginoglu-hakedis.types';

export const bilginogluHakEdisQueryKeys = {
  all: ['bilginoglu-hakedis'] as const,
  orders: (params: PagedParams) => [...bilginogluHakEdisQueryKeys.all, 'orders', params] as const,
  orderPlans: (orderHeaderId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'order-plans', orderHeaderId] as const,
  orderActivities: (orderHeaderId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'order-activities', orderHeaderId] as const,
  transferPreview: (orderHeaderId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'transfer-preview', orderHeaderId] as const,
  bulkTransferPreview: () => [...bilginogluHakEdisQueryKeys.all, 'bulk-transfer-preview'] as const,
  plans: (params: PagedParams) => [...bilginogluHakEdisQueryKeys.all, 'plans', params] as const,
  batches: (planId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'batches', planId] as const,
  steps: (batchId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'steps', batchId] as const,
  completedLocationSettings: () => [...bilginogluHakEdisQueryKeys.all, 'completed-location-settings'] as const,
  operationSettings: () => [...bilginogluHakEdisQueryKeys.all, 'operation-settings'] as const,
};

export function useBilginogluHakEdisOrdersQuery(params: PagedParams) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.orders(params),
    queryFn: () => bilginogluHakEdisApi.getOrders(params),
  });
}

export function useBilginogluHakEdisOrderPlansQuery(orderHeaderId: number | null) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.orderPlans(orderHeaderId),
    queryFn: () => bilginogluHakEdisApi.getOrderPlans(orderHeaderId ?? 0),
    enabled: Number.isFinite(orderHeaderId) && orderHeaderId != null && orderHeaderId > 0,
  });
}

export function useBilginogluHakEdisOrderActivitiesQuery(orderHeaderId: number | null) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.orderActivities(orderHeaderId),
    queryFn: () => bilginogluHakEdisApi.getOrderActivities(orderHeaderId ?? 0),
    enabled: Number.isFinite(orderHeaderId) && orderHeaderId != null && orderHeaderId > 0,
  });
}

export function useBilginogluHakEdisTransferPreviewQuery(orderHeaderId: number | null) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.transferPreview(orderHeaderId),
    queryFn: () => bilginogluHakEdisApi.getTransferPreview(orderHeaderId ?? 0),
    enabled: Number.isFinite(orderHeaderId) && orderHeaderId != null && orderHeaderId > 0,
  });
}

export function useBilginogluHakEdisBulkTransferPreviewQuery(enabled: boolean) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.bulkTransferPreview(),
    queryFn: () => bilginogluHakEdisApi.getBulkTransferPreview(),
    enabled,
  });
}

export function useBilginogluHakEdisPlansQuery(params: PagedParams) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.plans(params),
    queryFn: () => bilginogluHakEdisApi.getPlans(params),
  });
}

export function useBilginogluHakEdisBatchesQuery(planId: number | null) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.batches(planId),
    queryFn: () => bilginogluHakEdisApi.getBatches(planId ?? 0),
    enabled: Number.isFinite(planId) && planId != null && planId > 0,
  });
}

export function useBilginogluHakEdisStepsQuery(batchId: number | null) {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.steps(batchId),
    queryFn: () => bilginogluHakEdisApi.getSteps(batchId ?? 0),
    enabled: Number.isFinite(batchId) && batchId != null && batchId > 0,
  });
}

export function useEvaluateBilginogluHakEdisMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: (siparisNo?: string) => bilginogluHakEdisApi.evaluate(siparisNo),
    onSuccess: async (result) => {
      toast.success(t('messages.evaluated', { count: result.run.createdBatchCount }));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.evaluationFailed')),
  });
}

export function useBilginogluHakEdisBatchActionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: ({ batchId, action }: { batchId: number; action: string }) => bilginogluHakEdisApi.runBatchAction(batchId, action),
    onSuccess: async () => {
      toast.success(t('messages.batchCompleted'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.batchFailed')),
  });
}

export function useBilginogluHakEdisCreateSuggestedTransfersMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: (orderHeaderId: number) => bilginogluHakEdisApi.createSuggestedTransfers(orderHeaderId),
    onSuccess: async (result) => {
      toast.success(t('messages.transfersCreated', { count: result.createdBatches.length }));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.transfersFailed')),
  });
}

export function useBilginogluHakEdisBulkTransferOrdersMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: () => bilginogluHakEdisApi.createHakEdisTransferOrders(),
    onSuccess: async (result) => {
      toast.success(t('messages.bulkTransfersCreated', {
        transfers: result.createdTransferCount,
        advanced: result.advancedBatchCount,
        skipped: result.skippedCount,
      }));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.bulkTransfersFailed')),
  });
}

export function useBilginogluHakEdisBulkShipmentOrdersMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: () => bilginogluHakEdisApi.createShipmentOrders(),
    onSuccess: async (result) => {
      toast.success(t('messages.bulkShipmentsCreated', {
        shipments: result.createdShipmentCount,
        advanced: result.advancedBatchCount,
        skipped: result.skippedCount,
      }));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.bulkShipmentsFailed')),
  });
}

export function useBilginogluHakEdisOrderPolicyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: ({ orderHeaderId, input }: { orderHeaderId: number; input: UpdateBilginogluHakEdisOrderPolicy }) =>
      bilginogluHakEdisApi.updateOrderPolicy(orderHeaderId, input),
    onSuccess: async () => {
      toast.success(t('messages.policyUpdated'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.policyFailed')),
  });
}

export function useBilginogluHakEdisCompletedLocationSettingsQuery() {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.completedLocationSettings(),
    queryFn: () => bilginogluHakEdisApi.getCompletedLocationSettings(),
  });
}

export function useBilginogluHakEdisCompletedLocationSettingMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: UpsertBilginogluHakEdisCompletedLocationSetting }) =>
      id ? bilginogluHakEdisApi.updateCompletedLocationSetting(id, input) : bilginogluHakEdisApi.createCompletedLocationSetting(input),
    onSuccess: async () => {
      toast.success(t('locationSettings.messages.saved'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.completedLocationSettings() });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('locationSettings.messages.saveFailed')),
  });
}

export function useBilginogluHakEdisCompletedLocationSettingDeleteMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: (id: number) => bilginogluHakEdisApi.deleteCompletedLocationSetting(id),
    onSuccess: async () => {
      toast.success(t('locationSettings.messages.deleted'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.completedLocationSettings() });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('locationSettings.messages.deleteFailed')),
  });
}

export function useBilginogluHakEdisOperationSettingsQuery() {
  return useQuery({
    queryKey: bilginogluHakEdisQueryKeys.operationSettings(),
    queryFn: () => bilginogluHakEdisApi.getOperationSettings(),
  });
}

export function useBilginogluHakEdisOperationSettingMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: UpsertBilginogluHakEdisOperationSetting }) =>
      id ? bilginogluHakEdisApi.updateOperationSetting(id, input) : bilginogluHakEdisApi.createOperationSetting(input),
    onSuccess: async () => {
      toast.success(t('operationSettings.messages.saved'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.operationSettings() });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('operationSettings.messages.saveFailed')),
  });
}

export function useBilginogluHakEdisOperationSettingDeleteMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  return useMutation({
    mutationFn: (id: number) => bilginogluHakEdisApi.deleteOperationSetting(id),
    onSuccess: async () => {
      toast.success(t('operationSettings.messages.deleted'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.operationSettings() });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('operationSettings.messages.deleteFailed')),
  });
}
