import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  createGoodsReceiptFormSchema,
  type SelectedOrderItem,
  type OrderItem,
  type GoodsReceiptFormData,
} from '../types/goods-receipt';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2StockSelection } from './steps/Step2StockSelection';
import { OrderFetchSelectionPanel } from './steps/components/OrderFetchSelectionPanel';
import { SelectedOrderItemsPanel } from './steps/components/SelectedOrderItemsPanel';
import { GoodsReceiptContinuePanel } from './GoodsReceiptContinuePanel';
import { buildGoodsReceiptContinueSeed } from '../utils/build-goods-receipt-continue-seed';
import type { GoodsReceiptContinueSeed } from '@/features/shared';
import type { SelectedStockItem, Product } from '../types/goods-receipt';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function GoodsReceiptCreatePage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedStockItem[]>([]);
  const [continueSeed, setContinueSeed] = useState<GoodsReceiptContinueSeed | null>(null);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createGoodsReceiptFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      projectCode: '',
      customerId: '',
      customerRefId: undefined,
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GoodsReceiptFormData) => {
      return createMode === 'order'
        ? goodsReceiptApi.createGoodsReceiptOrder(formData, selectedItems)
        : goodsReceiptApi.createStockBasedGoodsReceiptOrder(formData, selectedStockItems);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('goodsReceipt.create.error'));
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      if (createMode === 'order') {
        const isValid = await form.trigger(['customerId']);
        if (!isValid) return;
        if (selectedItems.length === 0) {
          toast.error(t('common.validation.selectAtLeastOneItem'));
          return;
        }
      } else {
        const isValid = await form.trigger();
        if (!isValid) return;
      }
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

  const handleToggleItem = (item: OrderItem): void => {
    setSelectedItems((prev) => {
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
          targetCellCode: 'yer1',
        } as SelectedOrderItem,
      ];
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedOrderItem>): void => {
    setSelectedItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (createMode === 'order') {
      if (selectedItems.length === 0) {
        toast.error(t('common.validation.selectAtLeastOneItem'));
        return;
      }
      if (selectedItems.some((item) => !item.receiptQuantity || item.receiptQuantity <= 0)) {
        toast.error(t('goodsReceipt.validation.quantityRequired'));
        return;
      }
    } else if (selectedStockItems.some((item) => !item.receiptQuantity || item.receiptQuantity <= 0)) {
      toast.error(t('goodsReceipt.validation.quantityRequired'));
      return;
    }

    const formData = form.getValues();
    const headerId = await createMutation.mutateAsync(formData);
    toast.success(t('goodsReceipt.create.success'));

    const seed = buildGoodsReceiptContinueSeed({
      headerId,
      formData,
      items: createMode === 'order' ? selectedItems : selectedStockItems,
    });

    if (seed) {
      setContinueSeed(seed);
      return;
    }

    navigate('/goods-receipt/list');
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

  const handleRemoveLastStockItem = (stockCode: string): void => {
    setSelectedStockItems((prev) => {
      for (let index = prev.length - 1; index >= 0; index -= 1) {
        if (prev[index]?.stockCode === stockCode) {
          return prev.filter((_, itemIndex) => itemIndex !== index);
        }
      }

      return prev;
    });
  };

  const handleClearStockSelection = (stockCode: string): void => {
    setSelectedStockItems((prev) => prev.filter((item) => item.stockCode !== stockCode));
  };

  const steps = [
    { label: t('goodsReceipt.create.steps.basicInfo') },
    { label: createMode === 'order' ? t('goodsReceipt.create.steps.orderSelection') : t('goodsReceipt.create.steps.stockSelection') },
  ];

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
          </>
        }
        title={continueSeed ? t('goodsReceipt.continue.pageTitle') : t('goodsReceipt.create.title')}
        description={continueSeed ? t('goodsReceipt.continue.pageSubtitle') : t('goodsReceipt.create.subtitle')}
        actions={
          continueSeed ? undefined : (
          <Tabs
            value={createMode}
            onValueChange={(value) => setCreateMode(value as 'order' | 'stock')}
            className="w-full sm:w-auto"
          >
          <TabsList
            className={cn(
              'wms-ops-tabs w-full sm:w-auto',
              createMode === 'order' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
            )}
          >
            <span className="wms-ops-tab-indicator" aria-hidden />
            <TabsTrigger value="order" className="wms-ops-tab gap-1.5">
              <FileText className="size-3.5" />
              {t('goodsReceipt.create.mode.order')}
            </TabsTrigger>
            <TabsTrigger value="stock" className="wms-ops-tab gap-1.5">
              <Package className="size-3.5" />
              {t('goodsReceipt.create.mode.stock')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
          )
      }
    >
      {continueSeed ? (
        <GoodsReceiptContinuePanel seed={continueSeed} variant="ops" />
      ) : (
        <>
      <Breadcrumb
        items={steps.map((step, index) => ({
          label: step.label,
          isActive: index + 1 === currentStep,
        }))}
        className="wms-ops-steps mb-6"
      />

      <form className="space-y-6">
        <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
          {currentStep === 1 ? (
            <div className="space-y-6">
              <Step1BasicInfo variant="ops" hideDocumentFields={createMode === 'order'} />
              {createMode === 'order' ? (
                <OrderFetchSelectionPanel
                  variant="ops"
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                />
              ) : null}
            </div>
          ) : createMode === 'order' ? (
            <SelectedOrderItemsPanel
              variant="ops"
              selectedItems={selectedItems}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          ) : (
            <Step2StockSelection
              variant="ops"
              selectedItems={selectedStockItems}
              onToggleItem={handleToggleStockItem}
              onUpdateItem={handleUpdateStockItem}
              onRemoveItem={handleRemoveStockItem}
              onRemoveLastOfStock={handleRemoveLastStockItem}
              onClearStockSelection={handleClearStockSelection}
            />
          )}

          <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
            <OpsActionButton
              type="button"
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              {t('common.previous')}
            </OpsActionButton>
            <div className="flex gap-3">
              {currentStep < steps.length ? (
                <OpsActionButton
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={!permission.canCreate}
                >
                  {t('common.next')}
                  <ChevronRight className="size-3.5" aria-hidden />
                </OpsActionButton>
              ) : (
                <OpsActionButton
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={
                    !permission.canCreate
                    || createMutation.isPending
                    || (createMode === 'order' ? selectedItems.length === 0 : selectedStockItems.length === 0)
                  }
                >
                  {createMutation.isPending ? t('common.saving') : t('common.save')}
                  <ChevronRight className="size-3.5" aria-hidden />
                </OpsActionButton>
              )}
            </div>
          </div>
        </fieldset>
      </form>
        </>
      )}
    </OpsFormPageShell>
    </Form>
  );
}
