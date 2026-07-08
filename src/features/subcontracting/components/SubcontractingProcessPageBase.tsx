import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { ProcessStockSelection } from '@/features/shared/components/ProcessStockSelection';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import type { Product } from '@/features/shared';
import {
  createSubcontractingFormSchema,
  type SelectedSubcontractingStockItem,
  type SubcontractingFormData,
} from '../types/subcontracting';
import { subcontractingApi } from '../api/subcontracting-api';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';

interface SubcontractingProcessPageBaseProps {
  mode: 'issue' | 'receipt';
}

export function SubcontractingProcessPageBase({ mode }: SubcontractingProcessPageBaseProps): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission(mode === 'issue' ? 'wms.subcontracting.issue' : 'wms.subcontracting.receipt');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedSubcontractingStockItem[]>([]);

  const isIssue = mode === 'issue';
  const title = isIssue ? t('subcontracting.issue.process.title') : t('subcontracting.receipt.process.title');
  const subtitle = isIssue ? t('subcontracting.issue.process.subtitle') : t('subcontracting.receipt.process.subtitle');

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [setPageTitle, title]);

  const schema = useMemo(() => createSubcontractingFormSchema(t), [t]);

  const form = useForm<SubcontractingFormData>({
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

  const validSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0),
    [selectedItems],
  );

  const createMutation = useMutation({
    mutationFn: async (formData: SubcontractingFormData) =>
      isIssue
        ? subcontractingApi.processSubcontractingIssue(formData, validSelectedItems)
        : subcontractingApi.processSubcontractingReceipt(formData, validSelectedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [isIssue ? 'subcontractingIssueHeaders' : 'subcontractingReceiptHeaders'] });
      toast.success(isIssue ? t('subcontracting.issue.process.success') : t('subcontracting.receipt.process.success'));
      navigate(isIssue ? '/subcontracting/issue/list' : '/subcontracting/receipt/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || (isIssue ? t('subcontracting.issue.process.error') : t('subcontracting.receipt.process.error')));
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep === 2 && validSelectedItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = (): void => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleToggleItem = (item: Product): void => {
    setSelectedItems((prev) => [...prev, {
      id: `stock-${item.stokKodu}-${crypto.randomUUID()}`,
      stockId: item.id,
      yapKodId: undefined,
      stockCode: item.stokKodu,
      stockName: item.stokAdi,
      unit: item.olcuBr1,
      transferQuantity: 0,
      isSelected: true,
    }]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedSubcontractingStockItem>): void => {
    setSelectedItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    if (validSelectedItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }
    await createMutation.mutateAsync(form.getValues());
  };

  const steps = [
    { label: t('subcontracting.create.steps.basicInfo') },
    { label: t('subcontracting.process.steps.stockSelection') },
  ];

  const labels = {
    stocks: t('subcontracting.process.stocks'),
    selectedItems: t('subcontracting.process.selectedItems'),
    selectedItemsCount: t('subcontracting.process.selectedItemsCount'),
    searchStocks: t('subcontracting.process.searchStocks'),
    searchItems: t('subcontracting.process.searchItems'),
    noSelectedItems: t('subcontracting.process.noSelectedItems'),
    unit: t('common.unit'),
    serialNo: t('subcontracting.details.serialNo'),
    serialNoPlaceholder: t('subcontracting.details.serialNoPlaceholder'),
    serialNo2: t('subcontracting.details.serialNo2'),
    serialNo2Placeholder: t('subcontracting.details.serialNo2Placeholder'),
    lotNo: t('subcontracting.details.lotNo'),
    lotNoPlaceholder: t('subcontracting.details.lotNoPlaceholder'),
    batchNo: t('subcontracting.details.batchNo'),
    batchNoPlaceholder: t('subcontracting.details.batchNoPlaceholder'),
    configCode: t('subcontracting.details.configCode'),
    configCodePlaceholder: t('subcontracting.details.configCodePlaceholder'),
  };

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>}
        title={title}
        description={subtitle}
        actions={<span className="wms-ops-code-badge">{t('subcontracting.process.badge')}</span>}
      >
        {!permission.canCreate ? <PermissionNotice /> : null}
        <Breadcrumb items={steps.map((step, index) => ({ label: step.label, isActive: index + 1 === currentStep }))} className="wms-ops-steps mb-6" />
        <form className="space-y-6">
          <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
            {currentStep === 1 ? (
              <Step1SubcontractingBasicInfo
                permissionCode={`wms.subcontracting.${mode}.quantity-policy`}
                documentSeriesOperationType={isIssue ? 'SIT' : 'SRT'}
                variant="ops"
              />
            ) : (
              <div className="wms-ops-form wms-ops-list">
                <ProcessStockSelection selectedItems={selectedItems} onToggleItem={handleToggleItem} onUpdateItem={handleUpdateItem} onRemoveItem={handleRemoveItem} labels={labels} />
              </div>
            )}
            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton type="button" variant="secondary" onClick={handlePrevious} disabled={currentStep === 1}>
                <ChevronLeft className="size-3.5" aria-hidden />{t('common.previous')}
              </OpsActionButton>
              <div className="flex gap-3">
                {currentStep < steps.length ? (
                  <OpsActionButton type="button" variant="primary" onClick={handleNext} disabled={!permission.canCreate}>
                    {t('common.next')}<ChevronRight className="size-3.5" aria-hidden />
                  </OpsActionButton>
                ) : (
                  <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={!permission.canCreate || createMutation.isPending || validSelectedItems.length === 0}>
                    {createMutation.isPending ? t('common.saving') : t('common.save')}<ChevronRight className="size-3.5" aria-hidden />
                  </OpsActionButton>
                )}
              </div>
            </div>
          </fieldset>
        </form>
      </OpsFormPageShell>
    </Form>
  );
}
