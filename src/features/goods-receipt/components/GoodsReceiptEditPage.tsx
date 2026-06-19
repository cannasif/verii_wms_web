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
    shouldFocusError: false,
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
  const isFormDisabled = !permission.canUpdate || isBusy || headerQuery.isError;

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('common.edit')}</span>
          </>
        }
        title={t('goodsReceipt.edit.title')}
        description={t('goodsReceipt.edit.subtitle')}
        actions={
          Number.isFinite(headerId) && headerId > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="wms-ops-code-badge">#{headerId}</span>
              {headerQuery.data?.orderId ? (
                <span className="wms-ops-code-badge">{headerQuery.data.orderId}</span>
              ) : null}
              {headerQuery.data?.isCompleted ? (
                <span className="wms-ops-code-badge opacity-90">{t('goodsReceipt.report.completed')}</span>
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
          <PageState tone="error" title={t('goodsReceipt.edit.error')} compact />
        ) : null}

        {!headerQuery.isLoading && !headerQuery.isError ? (
          <form className="space-y-6">
            <fieldset
              disabled={isFormDisabled}
              className={cn(isFormDisabled && 'pointer-events-none opacity-75')}
            >
              <Step1BasicInfo variant="ops" />
            </fieldset>

            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/goods-receipt/list')}
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
