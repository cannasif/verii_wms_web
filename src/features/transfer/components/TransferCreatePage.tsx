import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  createTransferFormSchema,
  type SelectedTransferOrderItem,
  type TransferOrderItem,
  type TransferFormData,
} from '../types/transfer';
import { transferApi } from '../api/transfer-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1TransferBasicInfo } from './steps/Step1TransferBasicInfo';
import { Step2TransferOrderSelection } from './steps/Step2TransferOrderSelection';
import { Step2TransferStockSelection } from './steps/Step2TransferStockSelection';
import type { Product } from '@/features/shared';
import type { SelectedTransferStockItem } from '../types/transfer';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import {
  GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY,
  isGoodsReceiptContinueSeed,
  type GoodsReceiptContinueSeed,
} from '@/features/shared';

export function TransferCreatePage(): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.transfer');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedTransferOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedTransferStockItem[]>([]);
  const [grSeed, setGrSeed] = useState<GoodsReceiptContinueSeed | null>(null);
  const grSeedAppliedRef = useRef(false);
  const validSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0),
    [selectedItems],
  );
  const validSelectedStockItems = useMemo(
    () => selectedStockItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0),
    [selectedStockItems],
  );

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

  useEffect(() => {
    if (grSeedAppliedRef.current) return;
    const raw = (location.state as Record<string, unknown> | null)?.[GOODS_RECEIPT_CONTINUE_SEED_STATE_KEY];
    if (!isGoodsReceiptContinueSeed(raw)) return;

    grSeedAppliedRef.current = true;
    setGrSeed(raw);
    setCreateMode('stock');
    setCurrentStep(1);
    form.reset({
      ...form.getValues(),
      projectCode: raw.projectCode || '',
      customerId: raw.customerId || '',
      customerRefId: raw.customerRefId,
      notes: t('transfer.create.fromGoodsReceiptNotes', { documentNo: raw.documentNo }),
    });
    setSelectedStockItems(
      raw.lines.map((line) => ({
        id: `gr-seed-${line.stockCode}-${crypto.randomUUID()}`,
        stockId: line.stockId,
        stockCode: line.stockCode,
        stockName: line.stockName,
        unit: line.unit || '',
        transferQuantity: line.quantity,
        isSelected: true,
        serialNo: line.serialNo,
        configCode: line.configCode,
        yapKodId: line.yapKodId,
        targetCellCode: line.targetCellCode,
        sourceWarehouse: line.warehouseId,
      })),
    );
    navigate(location.pathname, { replace: true, state: {} });
  }, [form, location.pathname, location.state, navigate, t]);

  const createMutation = useMutation({
    mutationFn: async (formData: TransferFormData) =>
      createMode === 'order'
        ? transferApi.createTransferOrder(formData, validSelectedItems)
        : transferApi.createStockBasedTransferOrder(formData, validSelectedStockItems),
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
    if (currentStep === 2 && createMode === 'order' && validSelectedItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }
    if (currentStep === 2 && createMode === 'stock' && validSelectedStockItems.length === 0) {
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
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('transfer.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('transfer.create.breadcrumb.module')}</span>
          </>
        }
        title={t('transfer.create.title')}
        description={t('transfer.create.subtitle')}
        actions={
          <Tabs
            value={createMode}
            onValueChange={(value) => {
              if (grSeed) return;
              setCreateMode(value as 'order' | 'stock');
            }}
            className="w-full sm:w-auto"
          >
            <TabsList
              className={cn(
                'wms-ops-tabs w-full sm:w-auto',
                createMode === 'order' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
              )}
            >
              <span className="wms-ops-tab-indicator" aria-hidden />
              <TabsTrigger value="order" className="wms-ops-tab gap-1.5" disabled={Boolean(grSeed)}>
                <FileText className="size-3.5" />
                {t('transfer.create.mode.order')}
              </TabsTrigger>
              <TabsTrigger value="stock" className="wms-ops-tab gap-1.5">
                <Package className="size-3.5" />
                {t('transfer.create.mode.stock')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        {grSeed ? (
          <div className="mb-4 border border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,var(--wms-ops-card-border))] bg-[color-mix(in_oklab,var(--wms-ops-accent)_8%,transparent)] px-4 py-3 text-sm">
            {t('transfer.create.fromGoodsReceiptBanner', {
              documentNo: grSeed.documentNo,
              count: grSeed.lines.length,
            })}
          </div>
        ) : null}
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
              <Step1TransferBasicInfo isFreeTransfer={false} variant="ops" />
            ) : createMode === 'order' ? (
              <Step2TransferOrderSelection
                variant="ops"
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            ) : (
              <Step2TransferStockSelection
                variant="ops"
                selectedItems={selectedStockItems}
                onToggleItem={handleToggleStockItem}
                onUpdateItem={handleUpdateStockItem}
                onRemoveItem={handleRemoveStockItem}
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
                      || (createMode === 'order' ? validSelectedItems.length === 0 : validSelectedStockItems.length === 0)
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
      </OpsFormPageShell>
    </Form>
  );
}
