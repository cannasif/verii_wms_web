import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell, ProcessStockSelection } from '@/components/shared';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import {
  createSubcontractingFormSchema,
  type SelectedSubcontractingStockItem,
  type SubcontractingFormData,
} from '../types/subcontracting';
import { subcontractingApi } from '../api/subcontracting-api';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';

interface SubcontractingProcessPageBaseProps {
  mode: 'issue' | 'receipt';
}

export function SubcontractingProcessPageBase({ mode }: SubcontractingProcessPageBaseProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedSubcontractingStockItem[]>([]);

  const isIssue = mode === 'issue';
  const title = isIssue
    ? t('subcontracting.issue.process.title', { defaultValue: 'Missing translation' })
    : t('subcontracting.receipt.process.title', { defaultValue: 'Missing translation' });

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
      toast.success(
        isIssue
          ? t('subcontracting.issue.process.success', { defaultValue: 'Missing translation' })
          : t('subcontracting.receipt.process.success', { defaultValue: 'Missing translation' }),
      );
      navigate(isIssue ? '/subcontracting/issue/list' : '/subcontracting/receipt/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          (isIssue
            ? t('subcontracting.issue.process.error', { defaultValue: 'Missing translation' })
            : t('subcontracting.receipt.process.error', { defaultValue: 'Missing translation' })),
      );
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

  const handlePrevious = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleToggleItem = (item: Product): void => {
    setSelectedItems((prev) => [
      ...prev,
      {
        id: `stock-${item.stokKodu}-${crypto.randomUUID()}`,
        stockId: item.id,
        yapKodId: undefined,
        stockCode: item.stokKodu,
        stockName: item.stokAdi,
        unit: item.olcuBr1,
        transferQuantity: 0,
        isSelected: true,
      },
    ]);
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
    { label: t('subcontracting.process.steps.stockSelection', { defaultValue: 'Missing translation' }) },
  ];

  const labels = {
    stocks: t('subcontracting.process.stocks', { defaultValue: 'Missing translation' }),
    selectedItems: t('subcontracting.process.selectedItems', { defaultValue: 'Missing translation' }),
    selectedItemsCount: t('subcontracting.process.selectedItemsCount', { defaultValue: 'Missing translation' }),
    searchStocks: t('subcontracting.process.searchStocks', { defaultValue: 'Missing translation' }),
    searchItems: t('subcontracting.process.searchItems', { defaultValue: 'Missing translation' }),
    noSelectedItems: t('subcontracting.process.noSelectedItems', { defaultValue: 'Missing translation' }),
    unit: t('common.unit', { defaultValue: 'Missing translation' }),
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
    <div className="crm-page space-y-6">
      <Badge variant="secondary" className="mb-4">
        {t('subcontracting.process.badge', { defaultValue: 'Missing translation' })}
      </Badge>

      <Breadcrumb
        items={steps.map((step, index) => ({ label: step.label, isActive: index + 1 === currentStep }))}
        className="mb-4"
      />

      <FormPageShell
        title={title}
        description={
          isIssue
            ? t('subcontracting.issue.process.subtitle', { defaultValue: 'Missing translation' })
            : t('subcontracting.receipt.process.subtitle', { defaultValue: 'Missing translation' })
        }
      >
        <Form {...form}>
          <form className="crm-page space-y-6">
            {currentStep === 1 ? (
              <Step1SubcontractingBasicInfo />
            ) : (
              <ProcessStockSelection
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                labels={labels}
              />
            )}

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                {t('common.previous')}
              </Button>
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext}>{t('common.next')}</Button>
                ) : (
                  <Button type="button" onClick={handleSave} disabled={createMutation.isPending || validSelectedItems.length === 0}>
                    {createMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormPageShell>
    </div>
  );
}
