import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
import { subcontractingApi } from '../api/subcontracting-api';
import {
  createSubcontractingFormSchema,
  type SubcontractingFormData,
  type SubcontractingHeader,
} from '../types/subcontracting';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';

type SubcontractingEditKind = 'issue' | 'receipt';

const editConfig = {
  issue: {
    permission: 'wms.subcontracting.issue',
    titleKey: 'subcontracting.issue.edit.title',
    subtitleKey: 'subcontracting.issue.edit.subtitle',
    successKey: 'subcontracting.issue.edit.success',
    errorKey: 'subcontracting.issue.edit.error',
    completedKey: 'subcontracting.issue.list.completed',
    listPath: '/subcontracting/issue/list',
    queryKey: 'subcontracting-issue-header',
    headersQueryKey: 'subcontracting-issue-headers',
    getHeader: subcontractingApi.getIssueHeaderById,
    updateHeader: subcontractingApi.updateIssueHeader,
  },
  receipt: {
    permission: 'wms.subcontracting.receipt',
    titleKey: 'subcontracting.receipt.edit.title',
    subtitleKey: 'subcontracting.receipt.edit.subtitle',
    successKey: 'subcontracting.receipt.edit.success',
    errorKey: 'subcontracting.receipt.edit.error',
    completedKey: 'subcontracting.receipt.list.completed',
    listPath: '/subcontracting/receipt/list',
    queryKey: 'subcontracting-receipt-header',
    headersQueryKey: 'subcontracting-receipt-headers',
    getHeader: subcontractingApi.getReceiptHeaderById,
    updateHeader: subcontractingApi.updateReceiptHeader,
  },
} as const;

function toDateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0] || new Date().toISOString().split('T')[0];
}

function toFormValues(header: SubcontractingHeader): SubcontractingFormData {
  return {
    transferDate: toDateInput(header.documentDate || header.plannedDate),
    documentNo: header.documentNo || '',
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

function SubcontractingEditPageBase({ kind }: { kind: SubcontractingEditKind }): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const config = editConfig[kind];
  const permission = useCrudPermission(config.permission);
  const headerId = Number(id);

  const schema = useMemo(() => createSubcontractingFormSchema(t), [t]);
  const form = useForm<SubcontractingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transferDate: new Date().toISOString().split('T')[0],
      documentNo: '',
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
    queryKey: [config.queryKey, headerId],
    queryFn: ({ signal }) => config.getHeader(headerId, { signal }),
    enabled: Number.isFinite(headerId) && headerId > 0,
  });

  useEffect(() => {
    setPageTitle(t(config.titleKey));
    return () => setPageTitle(null);
  }, [config.titleKey, setPageTitle, t]);

  useEffect(() => {
    if (!headerQuery.data) return;
    form.reset(toFormValues(headerQuery.data));
  }, [form, headerQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: SubcontractingFormData) => config.updateHeader(headerId, formData),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || t(config.errorKey));
      toast.success(response.message || t(config.successKey));
      await queryClient.invalidateQueries({ queryKey: [config.headersQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [config.queryKey, headerId] });
      navigate(config.listPath);
    },
    onError: (error: Error) => toast.error(error.message || t(config.errorKey)),
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
        eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>}
        title={t(config.titleKey)}
        description={t(config.subtitleKey)}
        actions={headerQuery.data?.isCompleted ? <span className="wms-ops-code-badge">{t(config.completedKey)}</span> : undefined}
      >
        {!permission.canUpdate ? <PermissionNotice /> : null}
        <form className="space-y-6">
          <fieldset disabled={isFormDisabled} className={isFormDisabled ? 'pointer-events-none opacity-75' : undefined}>
            <Step1SubcontractingBasicInfo showOperationUsers={false} permissionCode={`${config.permission}.quantity-policy`} variant="ops" />
            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton type="button" variant="secondary" onClick={() => navigate(config.listPath)}>
                <ChevronLeft className="size-3.5" aria-hidden />{t('common.cancel')}
              </OpsActionButton>
              <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={isFormDisabled}>
                {updateMutation.isPending ? t('common.saving') : t('common.update')}
              </OpsActionButton>
            </div>
          </fieldset>
        </form>
      </OpsFormPageShell>
    </Form>
  );
}

export function SubcontractingIssueEditPage(): ReactElement {
  return <SubcontractingEditPageBase kind="issue" />;
}

export function SubcontractingReceiptEditPage(): ReactElement {
  return <SubcontractingEditPageBase kind="receipt" />;
}
