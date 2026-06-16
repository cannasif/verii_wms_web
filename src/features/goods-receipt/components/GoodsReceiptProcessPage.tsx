import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import {
  createGoodsReceiptFormSchema,
  type SelectedOrderItem,
  type OrderItem,
  type SelectedStockItem,
  type Product,
  type GoodsReceiptFormData,
} from '../types/goods-receipt';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2OrderSelection } from './steps/Step2OrderSelection';
import { Step2StockSelection } from './steps/Step2StockSelection';

export function GoodsReceiptProcessPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const [currentStep, setCurrentStep] = useState(1);
  const [processMode, setProcessMode] = useState<'order' | 'stock'>('order');
  const [selectedOrderItems, setSelectedOrderItems] = useState<SelectedOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.process.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createGoodsReceiptFormSchema(t), [t]);

  const form = useForm({
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

  const createMutation = useMutation({
    mutationFn: async (formData: GoodsReceiptFormData) => {
      return processMode === 'order'
        ? goodsReceiptApi.processGoodsReceipt(formData, selectedOrderItems, false)
        : goodsReceiptApi.processGoodsReceipt(formData, selectedStockItems, true);
    },
    onSuccess: () => {
      toast.success(t('goodsReceipt.process.success'));
      navigate('/goods-receipt/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('goodsReceipt.process.error'));
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }

    if (currentStep === 2 && processMode === 'order' && selectedOrderItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }

    if (currentStep === 2 && processMode === 'stock' && selectedStockItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleToggleOrderItem = (item: OrderItem): void => {
    setSelectedOrderItems((prev) => {
      const existingIndex = prev.findIndex((selected) => selected.id === item.id);
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }

      return [
        ...prev,
        {
          ...item,
          receiptQuantity: item.quantity || 0,
          isSelected: true,
        } as SelectedOrderItem,
      ];
    });
  };

  const handleUpdateOrderItem = (itemId: string, updates: Partial<SelectedOrderItem>): void => {
    setSelectedOrderItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveOrderItem = (itemId: string): void => {
    setSelectedOrderItems((prev) => prev.filter((item) => item.id !== itemId));
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
        receiptQuantity: 0,
        isSelected: true,
      } as SelectedStockItem,
    ]);
  };

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedStockItem>): void => {
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
    { label: t('goodsReceipt.create.steps.basicInfo') },
    { label: processMode === 'order' ? t('goodsReceipt.create.steps.orderSelection') : t('goodsReceipt.create.steps.stockSelection') },
  ];

  return (
    <div className="space-y-6 crm-page">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={processMode === 'order' ? 'default' : 'secondary'}>
          {processMode === 'order' ? t('goodsReceipt.create.mode.order') : t('goodsReceipt.create.mode.stock')}
        </Badge>
        <Tabs
          value={processMode}
          onValueChange={(value) => {
            setProcessMode(value as 'order' | 'stock');
            setCurrentStep(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="order">{t('goodsReceipt.create.mode.order')}</TabsTrigger>
            <TabsTrigger value="stock">{t('goodsReceipt.create.mode.stock')}</TabsTrigger>
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

      <FormPageShell
        title={t('goodsReceipt.process.title')}
        description={t('goodsReceipt.create.subtitle')}
      >
        {!permission.canCreate ? (
          <PermissionNotice />
        ) : null}
        <Form {...form}>
          <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
            <form className="space-y-6 crm-page">
              {currentStep === 1 ? (
                <Step1BasicInfo />
              ) : processMode === 'order' ? (
                <Step2OrderSelection
                  selectedItems={selectedOrderItems}
                  onToggleItem={handleToggleOrderItem}
                  onUpdateItem={handleUpdateOrderItem}
                  onRemoveItem={handleRemoveOrderItem}
                />
              ) : (
                <Step2StockSelection
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
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={
                        !permission.canCreate
                        || createMutation.isPending
                        || (processMode === 'order' ? selectedOrderItems.length === 0 : selectedStockItems.length === 0)
                      }
                    >
                      {createMutation.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </fieldset>
        </Form>
      </FormPageShell>
    </div>
  );
}
