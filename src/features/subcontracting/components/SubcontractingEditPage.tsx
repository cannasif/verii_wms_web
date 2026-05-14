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
  };
}

function SubcontractingEditPageBase({ kind }: { kind: SubcontractingEditKind }): ReactElement {
  const { t } = useTranslation();
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
      if (!response.success) {
        throw new Error(response.message || t(config.errorKey));
      }

      toast.success(response.message || t(config.successKey));
      await queryClient.invalidateQueries({ queryKey: [config.headersQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [config.queryKey, headerId] });
      navigate(config.listPath);
    },
    onError: (error: Error) => {
      toast.error(error.message || t(config.errorKey));
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
        {headerQuery.data?.isCompleted ? <Badge variant="outline">{t(config.completedKey)}</Badge> : null}
      </div>

      <FormPageShell title={t(config.titleKey)} description={t(config.subtitleKey)}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canUpdate || isBusy} className={!permission.canUpdate || isBusy ? 'pointer-events-none opacity-75' : undefined}>
              <Step1SubcontractingBasicInfo showOperationUsers={false} />
            </fieldset>

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(config.listPath)}>
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

export function SubcontractingIssueEditPage(): ReactElement {
  return <SubcontractingEditPageBase kind="issue" />;
}

export function SubcontractingReceiptEditPage(): ReactElement {
  return <SubcontractingEditPageBase kind="receipt" />;
}
