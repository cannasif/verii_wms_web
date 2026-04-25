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
  type SelectedTransferOrderItem,
  type TransferOrderItem,
  type TransferFormData,
} from '../types/transfer';
import { transferApi } from '../api/transfer-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1TransferBasicInfo } from './steps/Step1TransferBasicInfo';
import { Step2TransferOrderSelection } from './steps/Step2TransferOrderSelection';
import { Step2TransferStockSelection } from './steps/Step2TransferStockSelection';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import type { SelectedTransferStockItem } from '../types/transfer';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function TransferCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.transfer');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedTransferOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedTransferStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('transfer.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createTransferFormSchema(t, false), [t]);

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

  const createMutation = useMutation({
    mutationFn: async (formData: TransferFormData) =>
      createMode === 'order'
        ? transferApi.createTransferOrder(formData, selectedItems)
        : transferApi.createStockBasedTransferOrder(formData, selectedStockItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferHeaders'] });
      toast.success(t('transfer.create.success'));
      navigate('/transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('transfer.create.error'));
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep === 2 && createMode === 'order' && selectedItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }
    if (currentStep === 2 && createMode === 'stock' && selectedStockItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleToggleItem = (item: TransferOrderItem): void => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((selected) => selected.id === item.id);
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }

      return [
        ...prev,
        {
          ...item,
          transferQuantity: item.remainingForImport || 0,
          isSelected: true,
        },
      ];
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedTransferOrderItem>): void => {
    setSelectedItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleToggleStockItem = (item: Product): void => {
    setSelectedStockItems((prev) => [
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

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedTransferStockItem>): void => {
    setSelectedStockItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveStockItem = (itemId: string): void => {
    setSelectedStockItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    await createMutation.mutateAsync(form.getValues());
  };

  const steps = [
    { label: t('transfer.create.steps.basicInfo') },
    { label: createMode === 'order' ? t('transfer.create.steps.orderSelection') : t('transfer.create.steps.stockSelection') },
  ];

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center gap-3">
        <Badge variant={createMode === 'order' ? 'default' : 'secondary'}>
          {createMode === 'order' ? t('transfer.create.mode.order', { defaultValue: 'Missing translation' }) : t('transfer.create.mode.stock', { defaultValue: 'Missing translation' })}
        </Badge>
        <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as 'order' | 'stock')}>
          <TabsList>
            <TabsTrigger value="order">{t('transfer.create.mode.order', { defaultValue: 'Missing translation' })}</TabsTrigger>
            <TabsTrigger value="stock">{t('transfer.create.mode.stock', { defaultValue: 'Missing translation' })}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Breadcrumb
        items={steps.map((step, index) => ({
          label: step.label,
          isActive: index + 1 === currentStep,
        }))}
        className="mb-4"
      />

      <FormPageShell title={t('transfer.create.title')} description={t('transfer.create.subtitle')}>
        <Form {...form}>
          <form className="space-y-6 crm-page">
            <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
            {currentStep === 1 ? (
              <Step1TransferBasicInfo isFreeTransfer={false} />
            ) : createMode === 'order' ? (
              <Step2TransferOrderSelection
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            ) : (
              <Step2TransferStockSelection
                selectedItems={selectedStockItems}
                onToggleItem={handleToggleStockItem}
                onUpdateItem={handleUpdateStockItem}
                onRemoveItem={handleRemoveStockItem}
              />
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                {t('common.previous')}
              </Button>
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext} disabled={!permission.canCreate}>
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSave} disabled={!permission.canCreate || createMutation.isPending || (createMode === 'order' ? selectedItems.length === 0 : selectedStockItems.length === 0)}>
                    {createMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                )}
              </div>
            </div>
            </fieldset>
          </form>
        </Form>
      </FormPageShell>
    </div>
  );
}
