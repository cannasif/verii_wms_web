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
import { warehouseApi } from '../api/warehouse-api';
import {
  createWarehouseFormSchema,
  type WarehouseFormData,
  type WarehouseHeader,
} from '../types/warehouse';
import { Step1WarehouseBasicInfo } from './steps/Step1WarehouseBasicInfo';

function toDateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0] || new Date().toISOString().split('T')[0];
}

function toFormValues(header: WarehouseHeader): WarehouseFormData {
  return {
    operationType: header.outboundType || '',
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

export function WarehouseOutboundEditPage(): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.warehouse.outbound');
  const headerId = Number(id);

  const schema = useMemo(() => createWarehouseFormSchema(t, 'outbound', false), [t]);
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      operationType: '',
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
    queryKey: ['warehouse-outbound-header', headerId],
    queryFn: ({ signal }) => warehouseApi.getOutboundHeaderById(headerId, { signal }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    setPageTitle(t('warehouse.outbound.edit.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!headerQuery.data) return;
    form.reset(toFormValues(headerQuery.data));
  }, [form, headerQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: WarehouseFormData) => warehouseApi.updateOutboundHeader(headerId, formData),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('warehouse.outbound.edit.error'));
      }

      toast.success(response.message || t('warehouse.outbound.edit.success'));
      await queryClient.invalidateQueries({ queryKey: ['warehouse-outbound-headers'] });
      await queryClient.invalidateQueries({ queryKey: ['warehouse-outbound-header', headerId] });
      navigate('/warehouse/outbound/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('warehouse.outbound.edit.error'));
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
            <span>{t('warehouse.outbound.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('warehouse.outbound.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('common.edit')}</span>
          </>
        }
        title={t('warehouse.outbound.edit.title')}
        description={t('warehouse.outbound.edit.subtitle')}
        actions={
          Number.isFinite(headerId) && headerId > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="wms-ops-code-badge">#{headerId}</span>
              {headerQuery.data?.documentNo ? (
                <span className="wms-ops-code-badge">{headerQuery.data.documentNo}</span>
              ) : null}
              {headerQuery.data?.isCompleted ? (
                <span className="wms-ops-code-badge opacity-90">{t('warehouse.outbound.list.completed')}</span>
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
          <PageState tone="error" title={t('warehouse.outbound.edit.error')} compact />
        ) : null}

        {!headerQuery.isLoading && !headerQuery.isError ? (
          <form className="space-y-6">
            <fieldset
              disabled={isFormDisabled}
              className={cn(isFormDisabled && 'pointer-events-none opacity-75')}
            >
              <Step1WarehouseBasicInfo type="outbound" showOperationUsers={false} hideDocumentSeries variant="ops" />
            </fieldset>

            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/warehouse/outbound/list')}
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
