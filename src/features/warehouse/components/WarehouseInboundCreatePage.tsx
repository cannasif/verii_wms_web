import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  createWarehouseFormSchema,
  type SelectedWarehouseOrderItem,
  type WarehouseOrderItem,
  type WarehouseFormData,
} from '../types/warehouse';
import { warehouseApi } from '../api/warehouse-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1WarehouseBasicInfo } from './steps/Step1WarehouseBasicInfo';
import { Step2WarehouseOrderSelection } from './steps/Step2WarehouseOrderSelection';
import { Step2WarehouseStockSelection } from './steps/Step2WarehouseStockSelection';
import type { SelectedWarehouseStockItem, WarehouseStockItem } from '../types/warehouse';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function WarehouseInboundCreatePage(): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.warehouse.inbound');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedWarehouseOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedWarehouseStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('warehouse.inbound.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createWarehouseFormSchema(t, 'inbound'), [t]);

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      operationType: undefined,
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

  const createMutation = useMutation({
    mutationFn: async (formData: WarehouseFormData) =>
      createMode === 'order'
        ? warehouseApi.createWarehouseInbound(formData, selectedItems)
        : warehouseApi.createStockBasedWarehouseInbound(formData, selectedStockItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-inbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inbound-order-items'] });
      toast.success(t('warehouse.inbound.create.success'));
      navigate('/warehouse/inbound/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('warehouse.inbound.create.error'));
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

  const handleToggleItem = (item: WarehouseOrderItem): void => {
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
        } as SelectedWarehouseOrderItem,
      ];
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<SelectedWarehouseOrderItem>,
  ): void => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleToggleStockItem = (item: WarehouseStockItem): void => {
    setSelectedStockItems((prev) => [
      ...prev,
      { ...item, id: `${item.stockCode}-${crypto.randomUUID()}`, stockId: item.stockId, transferQuantity: 0, isSelected: true },
    ]);
  };

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedWarehouseStockItem>): void => {
    setSelectedStockItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveStockItem = (itemId: string): void => {
    setSelectedStockItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    await createMutation.mutateAsync(form.getValues());
  };

  const steps = [
    { label: t('warehouse.create.steps.basicInfo') },
    {
      label: createMode === 'order' ? t('warehouse.create.steps.orderSelection') : t('warehouse.create.steps.stockSelection'),
    },
  ];

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('warehouse.inbound.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('warehouse.inbound.create.breadcrumb.module')}</span>
          </>
        }
        title={t('warehouse.inbound.create.title')}
        description={t('warehouse.inbound.create.subtitle')}
        actions={
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
                {t('warehouse.create.mode.order')}
              </TabsTrigger>
              <TabsTrigger value="stock" className="wms-ops-tab gap-1.5">
                <Package className="size-3.5" />
                {t('warehouse.create.mode.stock')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
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
              <Step1WarehouseBasicInfo type="inbound" variant="ops" />
            ) : createMode === 'order' ? (
              <Step2WarehouseOrderSelection
                type="inbound"
                variant="ops"
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            ) : (
              <Step2WarehouseStockSelection
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
      </OpsFormPageShell>
    </Form>
  );
}
