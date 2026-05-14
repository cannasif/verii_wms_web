import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormPageShell } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
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
  };
}

export function TransferEditPage(): ReactElement {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6 crm-page">
      {!permission.canUpdate ? <PermissionNotice /> : null}
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{t('common.edit')}</Badge>
        {headerQuery.data?.isCompleted ? <Badge variant="outline">{t('transfer.list.completed', { defaultValue: 'Completed' })}</Badge> : null}
      </div>

      <FormPageShell title={t('transfer.edit.title')} description={t('transfer.edit.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canUpdate || isBusy} className={!permission.canUpdate || isBusy ? 'pointer-events-none opacity-75' : undefined}>
              <Step1TransferBasicInfo isFreeTransfer={false} hideDocumentSeries />
            </fieldset>

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/transfer/list')}>
                {t('common.cancel')}
              </Button>
              <Button type="button" onClick={handleSave} disabled={!permission.canUpdate || isBusy || headerQuery.isError}>
                {updateMutation.isPending ? t('common.saving') : t('common.update')}
              </Button>
            </div>
          </form>
        </Form>
      </FormPageShell>
    </div>
  );
}
