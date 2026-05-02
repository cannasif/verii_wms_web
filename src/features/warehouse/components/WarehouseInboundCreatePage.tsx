import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createWarehouseFormSchema,
  type SelectedWarehouseOrderItem,
  type WarehouseOrderItem,
  type WarehouseFormData,
} from '../types/warehouse';
import { warehouseApi } from '../api/warehouse-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1WarehouseBasicInfo } from './steps/Step1WarehouseBasicInfo';
import { Step2WarehouseOrderSelection } from './steps/Step2WarehouseOrderSelection';
import { Step2WarehouseStockSelection } from './steps/Step2WarehouseStockSelection';
import type { SelectedWarehouseStockItem, WarehouseStockItem } from '../types/warehouse';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function WarehouseInboundCreatePage(): ReactElement {
  const { t } = useTranslation();
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

  const form = useForm({
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
    mutationFn: async (formData: WarehouseFormData) => {
      return createMode === 'order'
        ? warehouseApi.createWarehouseInbound(formData, selectedItems)
        : warehouseApi.createStockBasedWarehouseInbound(formData, selectedStockItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-inbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inbound-order-items'] });
      toast.success(t('warehouse.inbound.create.success'));
      navigate('/warehouse/inbound/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('warehouse.inbound.create.error')
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
    updates: Partial<SelectedWarehouseOrderItem>
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

  const handleToggleStockItem = (item: WarehouseStockItem): void => {
    setSelectedStockItems((prev) => [...prev, { ...item, id: `${item.stockCode}-${crypto.randomUUID()}`, stockId: item.stockId, transferQuantity: 0, isSelected: true }]);
  };

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedWarehouseStockItem>): void => {
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
    { label: t('warehouse.create.steps.basicInfo') },
    {
      label: createMode === 'order' ? t('warehouse.create.steps.orderSelection') : t('warehouse.create.steps.stockSelection'),
    },
  ];

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1WarehouseBasicInfo type="inbound" />;
      case 2:
        return createMode === 'order' ? (
          <Step2WarehouseOrderSelection
            type="inbound"
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        ) : (
          <Step2WarehouseStockSelection
            selectedItems={selectedStockItems}
            onToggleItem={handleToggleStockItem}
            onUpdateItem={handleUpdateStockItem}
            onRemoveItem={handleRemoveStockItem}
          />
        );
      default:
        return <div>{t('warehouse.create.unknownStep')}</div>;
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center gap-3">
        <Badge variant={createMode === 'order' ? 'default' : 'secondary'}>
          {createMode === 'order' ? t('warehouse.create.mode.order', { defaultValue: 'Missing translation' }) : t('warehouse.create.mode.stock', { defaultValue: 'Missing translation' })}
        </Badge>
        <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as 'order' | 'stock')}>
          <TabsList>
            <TabsTrigger value="order">{t('warehouse.create.mode.order', { defaultValue: 'Missing translation' })}</TabsTrigger>
            <TabsTrigger value="stock">{t('warehouse.create.mode.stock', { defaultValue: 'Missing translation' })}</TabsTrigger>
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
            <form className="space-y-6 crm-page">
              <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
              {renderStepContent()}

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
                    <Button type="button" onClick={handleNext} disabled={!permission.canCreate}>
                      {t('common.next')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={!permission.canCreate || createMutation.isPending || (createMode === 'order' ? selectedItems.length === 0 : selectedStockItems.length === 0)}
                    >
                      {createMutation.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  )}
                </div>
              </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
