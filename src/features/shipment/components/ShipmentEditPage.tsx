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
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6 crm-page">
      {!permission.canUpdate ? <PermissionNotice /> : null}
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{t('common.edit')}</Badge>
        {headerQuery.data?.isCompleted ? <Badge variant="outline">{t('shipment.list.completed')}</Badge> : null}
      </div>

      <FormPageShell title={t('shipment.edit.title')} description={t('shipment.edit.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canUpdate || isBusy} className={!permission.canUpdate || isBusy ? 'pointer-events-none opacity-75' : undefined}>
              <Step1ShipmentBasicInfo hideDocumentSeries showOperationUsers={false} />
            </fieldset>

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/shipment/list')}>
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
