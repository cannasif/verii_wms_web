import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { transferChainApi } from '../api/transferChainApi';
import type {
  CreateTransferChainDto,
  CreateTransferChainStepDto,
  PagedParams,
  UpdateTransferChainDto,
  UpdateTransferChainStepDto,
} from '../types/transfer-chain.types';

export const transferChainQueryKeys = {
  all: ['transfer-chain'] as const,
  list: (params: PagedParams) => [...transferChainQueryKeys.all, 'list', params] as const,
  detail: (id: number | null) => [...transferChainQueryKeys.all, 'detail', id] as const,
};

export function useTransferChainsQuery(params: PagedParams) {
  return useQuery({
    queryKey: transferChainQueryKeys.list(params),
    queryFn: () => transferChainApi.getList(params),
  });
}

export function useTransferChainDetailQuery(id: number | null) {
  return useQuery({
    queryKey: transferChainQueryKeys.detail(id),
    queryFn: () => transferChainApi.getById(id ?? 0),
    enabled: Number.isFinite(id) && id != null && id > 0,
  });
}

export function useCreateTransferChainMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: (dto: CreateTransferChainDto) => transferChainApi.create(dto),
    onSuccess: async () => {
      toast.success(t('toast.createSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.createError')),
  });
}

export function useUpdateTransferChainMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateTransferChainDto }) => transferChainApi.update(id, dto),
    onSuccess: async (_data, variables) => {
      toast.success(t('toast.updateSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.detail(variables.id) });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.updateError')),
  });
}

export function useDeleteTransferChainMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: (id: number) => transferChainApi.delete(id),
    onSuccess: async () => {
      toast.success(t('toast.deleteSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.deleteError')),
  });
}

export function useAddTransferChainStepMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: ({ chainId, dto }: { chainId: number; dto: CreateTransferChainStepDto }) => transferChainApi.addStep(chainId, dto),
    onSuccess: async (_data, variables) => {
      toast.success(t('toast.stepCreateSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.detail(variables.chainId) });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.stepCreateError')),
  });
}

export function useUpdateTransferChainStepMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: ({ stepId, dto }: { stepId: number; dto: UpdateTransferChainStepDto }) => transferChainApi.updateStep(stepId, dto),
    onSuccess: async () => {
      toast.success(t('toast.stepUpdateSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.stepUpdateError')),
  });
}

export function useDeleteTransferChainStepMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('transfer-chain');
  return useMutation({
    mutationFn: (stepId: number) => transferChainApi.deleteStep(stepId),
    onSuccess: async () => {
      toast.success(t('toast.stepDeleteSuccess'));
      await queryClient.invalidateQueries({ queryKey: transferChainQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('toast.stepDeleteError')),
  });
}
