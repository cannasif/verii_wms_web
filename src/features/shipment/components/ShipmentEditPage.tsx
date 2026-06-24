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
import { shipmentApi } from '../api/shipment-api';
import {
  createShipmentFormSchema,
  type ShipmentFormData,
  type ShipmentHeader,
} from '../types/shipment';
import { Step1ShipmentBasicInfo } from './steps/Step1ShipmentBasicInfo';

function toDateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0] || new Date().toISOString().split('T')[0];
}

function toFormValues(header: ShipmentHeader): ShipmentFormData {
  return {
    transferDate: toDateInput(header.documentDate),
    documentNo: header.documentNo || '',
    documentSeriesDefinitionId: undefined,
    requiresEDispatch: false,
    projectCode: header.projectCode || '',
    customerId: header.customerCode || '',
    customerRefId: header.customerId ?? undefined,
    sourceWarehouse: header.sourceWarehouse || '',
    sourceWarehouseId: header.sourceWarehouseId ?? undefined,
    notes: header.description1 || '',
    userIds: [],
    allowLessQuantityBasedOnOrder: header.allowLessQuantityBasedOnOrder ?? false,
    allowMoreQuantityBasedOnOrder: header.allowMoreQuantityBasedOnOrder ?? false,
  };
}

export function ShipmentEditPage(): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shipment');
  const headerId = Number(id);

  const schema = useMemo(() => createShipmentFormSchema(t, false), [t]);
  const form = useForm<ShipmentFormData>({
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
      notes: '',
      userIds: [],
    },
  });

  const headerQuery = useQuery({
    queryKey: ['shipment-header', headerId],
    queryFn: ({ signal }) => shipmentApi.getHeaderById(headerId, { signal }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    setPageTitle(t('shipment.edit.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!headerQuery.data) return;
    form.reset(toFormValues(headerQuery.data));
  }, [form, headerQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: ShipmentFormData) => shipmentApi.updateHeader(headerId, formData),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('shipment.edit.error'));
      }

      toast.success(response.message || t('shipment.edit.success'));
      await queryClient.invalidateQueries({ queryKey: ['shipment-headers'] });
      await queryClient.invalidateQueries({ queryKey: ['shipment-header', headerId] });
      navigate('/shipment/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('shipment.edit.error'));
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
            <span>{t('shipment.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('shipment.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('common.edit')}</span>
          </>
        }
        title={t('shipment.edit.title')}
        description={t('shipment.edit.subtitle')}
        actions={
          Number.isFinite(headerId) && headerId > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="wms-ops-code-badge">#{headerId}</span>
              {headerQuery.data?.documentNo ? (
                <span className="wms-ops-code-badge">{headerQuery.data.documentNo}</span>
              ) : null}
              {headerQuery.data?.isCompleted ? (
                <span className="wms-ops-code-badge opacity-90">{t('shipment.list.completed')}</span>
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
          <PageState tone="error" title={t('shipment.edit.error')} compact />
        ) : null}

        {!headerQuery.isLoading && !headerQuery.isError ? (
          <form className="space-y-6">
            <fieldset
              disabled={isFormDisabled}
              className={cn(isFormDisabled && 'pointer-events-none opacity-75')}
            >
              <Step1ShipmentBasicInfo hideDocumentSeries showOperationUsers={false} variant="ops" />
            </fieldset>

            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/shipment/list')}
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
