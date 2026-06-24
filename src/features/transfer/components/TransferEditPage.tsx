import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { OpsActionButton, OpsFormPageShell, PageState } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { transferApi } from '../api/transfer-api';
import {
  createTransferFormSchema,
  type TransferFormData,
  type TransferHeader,
} from '../types/transfer';
import { Step1TransferBasicInfo } from './steps/Step1TransferBasicInfo';

function toDateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0] || new Date().toISOString().split('T')[0];
}

function toFormValues(header: TransferHeader): TransferFormData {
  return {
    transferDate: toDateInput(header.documentDate || header.plannedDate),
    documentNo: header.documentNo || '',
    documentSeriesDefinitionId: undefined,
    requiresEDispatch: false,
    projectCode: header.projectCode || '',
    customerId: header.customerCode || '',
    customerRefId: header.customerId ?? undefined,
    sourceWarehouse: header.sourceWarehouse || '',
    sourceWarehouseId: header.sourceWarehouseId ?? undefined,
    targetWarehouse: header.targetWarehouse || '',
    targetWarehouseId: header.targetWarehouseId ?? undefined,
    notes: header.description1 || '',
    userIds: [],
    allowLessQuantityBasedOnOrder: header.allowLessQuantityBasedOnOrder ?? false,
    allowMoreQuantityBasedOnOrder: header.allowMoreQuantityBasedOnOrder ?? false,
  };
}

export function TransferEditPage(): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.transfer');
  const headerId = Number(id);

  const schema = useMemo(() => createTransferFormSchema(t, false, false), [t]);
  const form = useForm<TransferFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transferDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      documentSeriesDefinitionId: undefined,
      requiresEDispatch: false,
      projectCode: '',
      customerId: '',
      customerRefId: undefined,
      sourceWarehouse: '',
      sourceWarehouseId: undefined,
      targetWarehouse: '',
      targetWarehouseId: undefined,
      notes: '',
      userIds: [],
    },
  });

  const headerQuery = useQuery({
    queryKey: ['transfer-header', headerId],
    queryFn: ({ signal }) => transferApi.getHeaderById(headerId, { signal }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    setPageTitle(t('transfer.edit.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!headerQuery.data) return;
    form.reset(toFormValues(headerQuery.data));
  }, [form, headerQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: TransferFormData) => transferApi.updateTransferHeader(headerId, formData, headerQuery.data?.type ?? 0),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('transfer.edit.error'));
      }

      toast.success(response.message || t('transfer.edit.success'));
      await queryClient.invalidateQueries({ queryKey: ['transferHeaders'] });
      await queryClient.invalidateQueries({ queryKey: ['transfer-header', headerId] });
      navigate('/transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('transfer.edit.error'));
    },
  });

  const handleSave = async (): Promise<void> => {
    const isValid = await form.trigger();
    if (!isValid) return;
    await updateMutation.mutateAsync(form.getValues());
  };

  const isBusy = headerQuery.isLoading || updateMutation.isPending;
  const isFormDisabled = !permission.canUpdate || isBusy || headerQuery.isError;

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('transfer.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('transfer.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('common.edit')}</span>
          </>
        }
        title={t('transfer.edit.title')}
        description={t('transfer.edit.subtitle')}
        actions={
          Number.isFinite(headerId) && headerId > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="wms-ops-code-badge">#{headerId}</span>
              {headerQuery.data?.documentNo ? (
                <span className="wms-ops-code-badge">{headerQuery.data.documentNo}</span>
              ) : null}
              {headerQuery.data?.isCompleted ? (
                <span className="wms-ops-code-badge opacity-90">{t('transfer.list.completed')}</span>
              ) : null}
            </div>
          ) : null
        }
      >
        {!permission.canUpdate ? <PermissionNotice /> : null}

        {headerQuery.isLoading ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {headerQuery.isError ? (
          <PageState tone="error" title={t('transfer.edit.error')} compact />
        ) : null}

        {!headerQuery.isLoading && !headerQuery.isError ? (
          <form className="space-y-6">
            <fieldset
              disabled={isFormDisabled}
              className={cn(isFormDisabled && 'pointer-events-none opacity-75')}
            >
              <Step1TransferBasicInfo isFreeTransfer={false} hideDocumentSeries variant="ops" />
            </fieldset>

            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/transfer/list')}
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                {t('common.cancel')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isFormDisabled}
              >
                {updateMutation.isPending ? t('common.saving') : t('common.update')}
              </OpsActionButton>
            </div>
          </form>
        ) : null}
      </OpsFormPageShell>
    </Form>
  );
}
