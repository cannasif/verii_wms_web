import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import {
  createTransferFormSchema,
  type SelectedTransferStockItem,
  type TransferFormData,
} from '../types/transfer';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import { transferApi } from '../api/transfer-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Step1TransferBasicInfo } from './steps/Step1TransferBasicInfo';
import { Step2TransferStockSelection } from './steps/Step2TransferStockSelection';

export function TransferProcessPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedTransferStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('transfer.process.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createTransferFormSchema(t, true), [t]);

  const form = useForm<TransferFormData>({
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
    mutationFn: async (formData: TransferFormData) => transferApi.processTransfer(formData, validSelectedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferHeaders'] });
      queryClient.invalidateQueries({ queryKey: ['transferHeadersPaged'] });
      toast.success(t('transfer.process.success'));
      navigate('/transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('transfer.process.error'));
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
        stockCode: item.stokKodu,
        stockName: item.stokAdi,
        unit: item.olcuBr1,
        transferQuantity: 0,
        isSelected: true,
      },
    ]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedTransferStockItem>): void => {
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
    { label: t('transfer.create.steps.basicInfo') },
    { label: t('transfer.create.steps.stockSelection') },
  ];

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary" className="mb-4">
        {t('transfer.create.mode.free')}
      </Badge>

      <Breadcrumb
        items={steps.map((step, index) => ({
          label: step.label,
          isActive: index + 1 === currentStep,
        }))}
        className="mb-4"
      />

      <FormPageShell title={t('transfer.process.title')} description={t('transfer.process.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            {currentStep === 1 ? (
              <Step1TransferBasicInfo isFreeTransfer />
            ) : (
              <Step2TransferStockSelection
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                {t('common.previous')}
              </Button>
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext}>
                    {t('common.next')}
                  </Button>
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
