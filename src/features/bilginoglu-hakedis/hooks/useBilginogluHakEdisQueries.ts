import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { bilginogluHakEdisApi } from '../api/bilginogluHakEdisApi';
import type { PagedParams, UpdateBilginogluHakEdisOrderPolicy } from '../types/bilginoglu-hakedis.types';

export const bilginogluHakEdisQueryKeys = {
  all: ['bilginoglu-hakedis'] as const,
  orders: (params: PagedParams) => [...bilginogluHakEdisQueryKeys.all, 'orders', params] as const,
  orderPlans: (orderHeaderId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'order-plans', orderHeaderId] as const,
  orderActivities: (orderHeaderId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'order-activities', orderHeaderId] as const,
  plans: (params: PagedParams) => [...bilginogluHakEdisQueryKeys.all, 'plans', params] as const,
  batches: (planId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'batches', planId] as const,
  steps: (batchId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'steps', batchId] as const,
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
  const { t } = useTranslation('bilginoglu-hakedis');
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
  const { t } = useTranslation('bilginoglu-hakedis');
  return useMutation({
    mutationFn: ({ batchId, action }: { batchId: number; action: string }) => bilginogluHakEdisApi.runBatchAction(batchId, action),
    onSuccess: async () => {
      toast.success(t('messages.batchCompleted'));
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('messages.batchFailed')),
  });
}

export function useBilginogluHakEdisOrderPolicyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('bilginoglu-hakedis');
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
