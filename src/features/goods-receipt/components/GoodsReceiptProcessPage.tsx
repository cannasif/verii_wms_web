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
  type SelectedStockItem,
  type Product,
  type GoodsReceiptFormData,
} from '../types/goods-receipt';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2StockSelection } from './steps/Step2StockSelection';
import { OrderFetchSelectionPanel } from './steps/components/OrderFetchSelectionPanel';
import { SelectedOrderItemsPanel } from './steps/components/SelectedOrderItemsPanel';
import { GoodsReceiptContinuePanel } from './GoodsReceiptContinuePanel';
import { buildGoodsReceiptContinueSeed } from '../utils/build-goods-receipt-continue-seed';
import type { GoodsReceiptContinueSeed } from '@/features/shared';

export function GoodsReceiptProcessPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const [currentStep, setCurrentStep] = useState(1);
  const [processMode, setProcessMode] = useState<'order' | 'stock'>('order');
  const [selectedOrderItems, setSelectedOrderItems] = useState<SelectedOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedStockItem[]>([]);
  const [continueSeed, setContinueSeed] = useState<GoodsReceiptContinueSeed | null>(null);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.process.title'));
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
      return processMode === 'order'
        ? goodsReceiptApi.processGoodsReceipt(formData, selectedOrderItems, false)
        : goodsReceiptApi.processGoodsReceipt(formData, selectedStockItems, true);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('goodsReceipt.process.error'));
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      if (processMode === 'order') {
        const isValid = await form.trigger(['customerId']);
        if (!isValid) return;
        if (selectedOrderItems.length === 0) {
          toast.error(t('common.validation.selectAtLeastOneItem'));
          return;
        }
      } else {
        const isValid = await form.trigger();
        if (!isValid) return;
      }
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
          targetCellCode: 'yer1',
          warehouseId: item.targetWh || undefined,
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

  const handleSave = async (): Promise<void> => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (processMode === 'order') {
      if (selectedOrderItems.length === 0) {
        toast.error(t('common.validation.selectAtLeastOneItem'));
        return;
      }
      if (selectedOrderItems.some((item) => !item.receiptQuantity || item.receiptQuantity <= 0)) {
        toast.error(t('goodsReceipt.validation.quantityRequired'));
        return;
      }
    } else if (selectedStockItems.some((item) => !item.receiptQuantity || item.receiptQuantity <= 0)) {
      toast.error(t('goodsReceipt.validation.quantityRequired'));
      return;
    }

    const formData = form.getValues();
    const headerId = await createMutation.mutateAsync(formData);
    toast.success(t('goodsReceipt.process.success'));

    let qualityStatus: string | null = null;
    try {
      const header = await goodsReceiptApi.getGrHeaderById(headerId);
      qualityStatus = header.qualityStatus ?? null;
    } catch {
      qualityStatus = null;
    }

    const seed = buildGoodsReceiptContinueSeed({
      headerId,
      formData,
      items: processMode === 'order' ? selectedOrderItems : selectedStockItems,
      qualityStatus,
    });

    if (seed) {
      setContinueSeed(seed);
      return;
    }

    navigate('/goods-receipt/list');
  };

  const steps = [
    { label: t('goodsReceipt.create.steps.basicInfo') },
    { label: processMode === 'order' ? t('goodsReceipt.create.steps.orderSelection') : t('goodsReceipt.create.steps.stockSelection') },
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
        title={continueSeed ? t('goodsReceipt.continue.pageTitle') : t('goodsReceipt.process.title')}
        description={continueSeed ? t('goodsReceipt.continue.pageSubtitle') : t('goodsReceipt.create.subtitle')}
        actions={
          continueSeed ? undefined : (
          <Tabs
            value={processMode}
            onValueChange={(value) => setProcessMode(value as 'order' | 'stock')}
            className="w-full sm:w-auto"
          >
            <TabsList
              className={cn(
                'wms-ops-tabs w-full sm:w-auto',
                processMode === 'order' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
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
        {!permission.canCreate ? <PermissionNotice /> : null}

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
                <Step1BasicInfo variant="ops" hideDocumentFields={processMode === 'order'} />
                {processMode === 'order' ? (
                  <OrderFetchSelectionPanel
                    variant="ops"
                    selectedItems={selectedOrderItems}
                    onToggleItem={handleToggleOrderItem}
                  />
                ) : null}
              </div>
            ) : processMode === 'order' ? (
              <SelectedOrderItemsPanel
                variant="ops"
                selectedItems={selectedOrderItems}
                onUpdateItem={handleUpdateOrderItem}
                onRemoveItem={handleRemoveOrderItem}
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
                      || (processMode === 'order' ? selectedOrderItems.length === 0 : selectedStockItems.length === 0)
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
