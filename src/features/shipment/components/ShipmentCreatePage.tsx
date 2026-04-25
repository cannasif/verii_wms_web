import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createShipmentFormSchema,
  type SelectedShipmentOrderItem,
  type ShipmentOrderItem,
  type ShipmentFormData,
} from '../types/shipment';
import { shipmentApi } from '../api/shipment-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1ShipmentBasicInfo } from './steps/Step1ShipmentBasicInfo';
import { Step2ShipmentOrderSelection } from './steps/Step2ShipmentOrderSelection';
import { ProcessStockSelection } from '@/components/shared';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import type { SelectedShipmentStockItem } from '../types/shipment';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function ShipmentCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shipment');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedShipmentOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedShipmentStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('shipment.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createShipmentFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      transferDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      projectCode: '',
      customerId: '',
      sourceWarehouse: '',
      notes: '',
      userIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ShipmentFormData) => {
      return createMode === 'order'
        ? shipmentApi.createShipment(formData, selectedItems)
        : shipmentApi.createStockBasedShipment(formData, selectedStockItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-order-items'] });
      toast.success(t('shipment.create.success'));
      navigate('/shipment/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('shipment.create.error')
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

  const handleToggleItem = (item: ShipmentOrderItem): void => {
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
        } as SelectedShipmentOrderItem,
      ];
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<SelectedShipmentOrderItem>
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

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedShipmentStockItem>): void => {
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
    { label: t('shipment.create.steps.basicInfo') },
    {
      label: createMode === 'order' ? t('shipment.create.steps.orderSelection') : t('shipment.process.steps.stockSelection', { defaultValue: 'Missing translation' }),
    },
  ];

  const stockLabels = {
    stocks: t('shipment.process.stocks', { defaultValue: 'Missing translation' }),
    selectedItems: t('shipment.process.selectedItems', { defaultValue: 'Missing translation' }),
    selectedItemsCount: t('shipment.process.selectedItemsCount', { defaultValue: 'Missing translation' }),
    searchStocks: t('shipment.process.searchStocks', { defaultValue: 'Missing translation' }),
    searchItems: t('shipment.process.searchItems', { defaultValue: 'Missing translation' }),
    noSelectedItems: t('shipment.process.noSelectedItems', { defaultValue: 'Missing translation' }),
    unit: t('shipment.step2.unit'),
    serialNo: t('shipment.details.serialNo'),
    serialNoPlaceholder: t('shipment.details.serialNoPlaceholder'),
    serialNo2: t('shipment.details.serialNo2'),
    serialNo2Placeholder: t('shipment.details.serialNo2Placeholder'),
    lotNo: t('shipment.details.lotNo'),
    lotNoPlaceholder: t('shipment.details.lotNoPlaceholder'),
    batchNo: t('shipment.details.batchNo'),
    batchNoPlaceholder: t('shipment.details.batchNoPlaceholder'),
    configCode: t('shipment.details.configCode'),
    configCodePlaceholder: t('shipment.details.configCodePlaceholder'),
  };

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1ShipmentBasicInfo />;
      case 2:
        return (
          <Step2ShipmentOrderSelection
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <div>{t('shipment.create.unknownStep')}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={createMode === 'order' ? 'default' : 'secondary'}>
          {createMode === 'order' ? t('shipment.create.mode.order', { defaultValue: 'Missing translation' }) : t('shipment.create.mode.stock', { defaultValue: 'Missing translation' })}
        </Badge>
        <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as 'order' | 'stock')}>
          <TabsList>
            <TabsTrigger value="order">{t('shipment.create.mode.order', { defaultValue: 'Missing translation' })}</TabsTrigger>
            <TabsTrigger value="stock">{t('shipment.create.mode.stock', { defaultValue: 'Missing translation' })}</TabsTrigger>
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
              <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
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



