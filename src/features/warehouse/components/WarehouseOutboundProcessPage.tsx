import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createWarehouseFormSchema,
  type SelectedWarehouseStockItem,
  type WarehouseFormData,
  type WarehouseStockItem,
} from '../types/warehouse';
import { warehouseApi } from '../api/warehouse-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Step1WarehouseBasicInfo } from './steps/Step1WarehouseBasicInfo';
import { Step2WarehouseStockSelection } from './steps/Step2WarehouseStockSelection';

export function WarehouseOutboundProcessPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedWarehouseStockItem[]>([]);
  const validSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0),
    [selectedItems],
  );

  useEffect(() => {
    setPageTitle(t('warehouse.outbound.process.title'));
    return () => {
      setPageTitle(null);
    };
  }, [setPageTitle, t]);

  const schema = useMemo(() => createWarehouseFormSchema(t, 'outbound'), [t]);

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      operationType: undefined,
      transferDate: new Date().toISOString().split('T')[0],
      documentNo: '',
      projectCode: '',
      customerId: '',
      sourceWarehouse: '',
      targetWarehouse: '',
      notes: '',
      userIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: WarehouseFormData) => {
      return warehouseApi.processWarehouseOutbound(formData, validSelectedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse.outboundHeaders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse.outboundHeadersPaged'] });
      toast.success(t('warehouse.outbound.process.success'));
      navigate('/warehouse/outbound/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('warehouse.outbound.process.error'));
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

  const handleToggleItem = (item: WarehouseStockItem): void => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((selected) => selected.stockCode === item.stockCode);
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex);
      }

      return [
        ...prev,
        {
          ...item,
          transferQuantity: 0,
          isSelected: true,
        },
      ];
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedWarehouseStockItem>): void => {
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

    const formData = form.getValues();
    await createMutation.mutateAsync(formData);
  };

  const steps = [
    { label: t('warehouse.create.steps.basicInfo') },
    { label: t('warehouse.create.steps.stockSelection') },
  ];

  return (
    <div className="space-y-6 crm-page">
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
              {currentStep === 1 ? (
                <Step1WarehouseBasicInfo type="outbound" showOperationUsers={false} />
              ) : (
                <Step2WarehouseStockSelection
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
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={createMutation.isPending || validSelectedItems.length === 0}
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
