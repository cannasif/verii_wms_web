import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bilginogluHakEdisApi } from '../api/bilginogluHakEdisApi';
import type { PagedParams } from '../types/bilginoglu-hakedis.types';

export const bilginogluHakEdisQueryKeys = {
  all: ['bilginoglu-hakedis'] as const,
  plans: (params: PagedParams) => [...bilginogluHakEdisQueryKeys.all, 'plans', params] as const,
  batches: (planId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'batches', planId] as const,
  steps: (batchId: number | null) => [...bilginogluHakEdisQueryKeys.all, 'steps', batchId] as const,
};

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
  return useMutation({
    mutationFn: (siparisNo?: string) => bilginogluHakEdisApi.evaluate(siparisNo),
    onSuccess: async (result) => {
      toast.success(`Hakediş değerlendirildi. Batch: ${result.run.createdBatchCount}`);
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Hakediş değerlendirmesi çalıştırılamadı.'),
  });
}
