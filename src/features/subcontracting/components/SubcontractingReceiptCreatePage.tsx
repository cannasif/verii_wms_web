import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createSubcontractingFormSchema,
  type SelectedSubcontractingOrderItem,
  type SubcontractingOrderItem,
  type SubcontractingFormData,
} from '../types/subcontracting';
import { subcontractingApi } from '../api/subcontracting-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';
import { Step2SubcontractingOrderSelection } from './steps/Step2SubcontractingOrderSelection';
import { ProcessStockSelection } from '@/components/shared';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import type { SelectedSubcontractingStockItem } from '../types/subcontracting';

export function SubcontractingReceiptCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedSubcontractingOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedSubcontractingStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('subcontracting.receipt.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createSubcontractingFormSchema(t), [t]);

  const form = useForm({
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
    mutationFn: async (formData: SubcontractingFormData) => {
      return createMode === 'order'
        ? subcontractingApi.createSubcontractingReceipt(formData, selectedItems)
        : subcontractingApi.createStockBasedSubcontractingReceipt(formData, selectedStockItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontracting-receipt-orders'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-receipt-order-items'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-receipt-headers'] });
      toast.success(t('subcontracting.receipt.create.success'));
      navigate('/subcontracting/receipt/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('subcontracting.receipt.create.error')
      );
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

  const handleToggleItem = (item: SubcontractingOrderItem): void => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((si) => si.id === item.id);
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }
      const orderItem = item;
      return [
        ...prev,
        {
          ...orderItem,
          transferQuantity: orderItem.remainingForImport || 0,
          isSelected: true,
        } as SelectedSubcontractingOrderItem,
      ];
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<SelectedSubcontractingOrderItem>
  ): void => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        const itemIdMatch = item.id === itemId;
        return itemIdMatch ? { ...item, ...updates } : item;
      })
    );
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.id !== itemId)
    );
  };

  const handleToggleStockItem = (item: Product): void => {
    setSelectedStockItems((prev) => [...prev, { id: `stock-${item.stokKodu}-${crypto.randomUUID()}`, stockId: item.id, yapKodId: undefined, stockCode: item.stokKodu, stockName: item.stokAdi, unit: item.olcuBr1, transferQuantity: 0, isSelected: true }]);
  };

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedSubcontractingStockItem>): void => {
    setSelectedStockItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveStockItem = (itemId: string): void => {
    setSelectedStockItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    const formData = form.getValues();
    await createMutation.mutateAsync(formData);
  };

  const steps = [
    { label: t('subcontracting.create.steps.basicInfo') },
    {
      label: createMode === 'order' ? t('subcontracting.create.steps.orderSelection') : t('subcontracting.process.steps.stockSelection', { defaultValue: 'Stok Seçimi' }),
    },
  ];

  const stockLabels = {
    stocks: t('subcontracting.process.stocks', { defaultValue: 'Stoklar' }),
    selectedItems: t('subcontracting.process.selectedItems', { defaultValue: 'Seçilen Kalemler' }),
    selectedItemsCount: t('subcontracting.process.selectedItemsCount', { defaultValue: '{{count}} kalem' }),
    searchStocks: t('subcontracting.process.searchStocks', { defaultValue: 'Stok kodu veya adı ile ara...' }),
    searchItems: t('subcontracting.process.searchItems', { defaultValue: 'Seçilenleri ara...' }),
    noSelectedItems: t('subcontracting.process.noSelectedItems', { defaultValue: 'Seçili stok bulunmamaktadır' }),
    unit: t('common.unit', { defaultValue: 'Birim' }),
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

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1SubcontractingBasicInfo />;
      case 2:
        return (
          <Step2SubcontractingOrderSelection
            type="receipt"
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <div>{t('subcontracting.create.unknownStep')}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={createMode === 'order' ? 'default' : 'secondary'}>
          {createMode === 'order' ? t('subcontracting.create.mode.order', { defaultValue: 'Sipariş bazlı' }) : t('subcontracting.create.mode.stock', { defaultValue: 'Stok bazlı' })}
        </Badge>
        <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as 'order' | 'stock')}>
          <TabsList>
            <TabsTrigger value="order">{t('subcontracting.create.mode.order', { defaultValue: 'Sipariş bazlı' })}</TabsTrigger>
            <TabsTrigger value="stock">{t('subcontracting.create.mode.stock', { defaultValue: 'Stok bazlı' })}</TabsTrigger>
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

      <Card>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {currentStep === 1 ? renderStepContent() : createMode === 'order' ? renderStepContent() : (
                <ProcessStockSelection
                  selectedItems={selectedStockItems}
                  onToggleItem={handleToggleStockItem}
                  onUpdateItem={handleUpdateStockItem}
                  onRemoveItem={handleRemoveStockItem}
                  labels={stockLabels}
                />
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  {t('common.previous')}
                </Button>
                <div className="flex gap-2">
                  {currentStep < steps.length ? (
                    <Button type="button" onClick={handleNext}>
                      {t('common.next')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={createMutation.isPending || (createMode === 'order' ? selectedItems.length === 0 : selectedStockItems.length === 0)}
                    >
                      {createMutation.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
