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
import { goodsReceiptApi } from '../api/goods-receipt-api';
import {
  createGoodsReceiptFormSchema,
  type GoodsReceiptFormData,
  type GrHeader,
} from '../types/goods-receipt';
import { Step1BasicInfo } from './steps/Step1BasicInfo';

function toDateInput(value?: string | null): string {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }

  return value.split('T')[0] || new Date().toISOString().split('T')[0];
}

function toFormValues(header: GrHeader): GoodsReceiptFormData {
  const documentNo = header.documentNo || header.orderId || '';

  return {
    receiptDate: toDateInput(header.documentDate || header.plannedDate),
    documentNo,
    projectCode: header.projectCode || '',
    isInvoice: documentNo.replace(/\D/g, '').length === 16,
    customerId: header.customerCode || '',
    customerRefId: header.customerId ?? undefined,
    notes: header.description1 || '',
    allowLessQuantityBasedOnOrder: header.allowLessQuantityBasedOnOrder ?? false,
    allowMoreQuantityBasedOnOrder: header.allowMoreQuantityBasedOnOrder ?? false,
  };
}

export function GoodsReceiptEditPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const headerId = Number(id);

  const schema = useMemo(() => createGoodsReceiptFormSchema(t), [t]);
  const form = useForm<GoodsReceiptFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      projectCode: '',
      isInvoice: false,
      customerId: '',
      customerRefId: undefined,
      notes: '',
    },
  });

  const headerQuery = useQuery({
    queryKey: ['goods-receipt-header', headerId],
    queryFn: ({ signal }) => goodsReceiptApi.getGrHeaderById(headerId, { signal }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    setPageTitle(t('goodsReceipt.edit.title'));
    return () => {
      setPageTitle(null);
    };
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!headerQuery.data) return;
    form.reset(toFormValues(headerQuery.data));
  }, [form, headerQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: GoodsReceiptFormData) => goodsReceiptApi.updateGoodsReceiptHeader(headerId, formData),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('goodsReceipt.edit.error'));
      }

      toast.success(response.message || t('goodsReceipt.edit.success'));
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-headers'] });
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-header', headerId] });
      navigate('/goods-receipt/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('goodsReceipt.edit.error'));
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
        {headerQuery.data?.isCompleted ? <Badge variant="outline">{t('goodsReceipt.report.completed')}</Badge> : null}
      </div>

      <FormPageShell title={t('goodsReceipt.edit.title')} description={t('goodsReceipt.edit.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canUpdate || isBusy} className={!permission.canUpdate || isBusy ? 'pointer-events-none opacity-75' : undefined}>
              <Step1BasicInfo />
            </fieldset>

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/goods-receipt/list')}>
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
