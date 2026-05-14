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
  };
}

export function WarehouseOutboundEditPage(): ReactElement {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6 crm-page">
      {!permission.canUpdate ? <PermissionNotice /> : null}
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{t('common.edit')}</Badge>
        {headerQuery.data?.isCompleted ? <Badge variant="outline">{t('warehouse.outbound.list.completed')}</Badge> : null}
      </div>

      <FormPageShell title={t('warehouse.outbound.edit.title')} description={t('warehouse.outbound.edit.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canUpdate || isBusy} className={!permission.canUpdate || isBusy ? 'pointer-events-none opacity-75' : undefined}>
              <Step1WarehouseBasicInfo type="outbound" showOperationUsers={false} hideDocumentSeries />
            </fieldset>

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/warehouse/outbound/list')}>
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
