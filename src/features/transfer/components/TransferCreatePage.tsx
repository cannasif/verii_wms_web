import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createTransferFormSchema,
  type SelectedTransferOrderItem,
  type SelectedTransferStockItem,
  type TransferOrderItem,
  type TransferFormData,
} from '../types/transfer';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import { transferApi } from '../api/transfer-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Step1TransferBasicInfo } from './steps/Step1TransferBasicInfo';
import { Step2TransferOrderSelection } from './steps/Step2TransferOrderSelection';
import { Step2TransferStockSelection } from './steps/Step2TransferStockSelection';

type TransferMode = 'order' | 'free';

export function TransferCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [transferMode, setTransferMode] = useState<TransferMode>('order');
  const [selectedItems, setSelectedItems] = useState<
    (SelectedTransferOrderItem | SelectedTransferStockItem)[]
  >([]);

  useEffect(() => {
    setPageTitle(t('transfer.create.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createTransferFormSchema(t, transferMode === 'free'), [t, transferMode]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
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
    mutationFn: async (formData: TransferFormData) => {
      return transferApi.createTransfer(formData, selectedItems, transferMode === 'free');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferHeaders'] });
      toast.success(t('transfer.create.success'));
      navigate('/transfer/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('transfer.create.error')
      );
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep === 2 && selectedItems.length === 0) {
      toast.error(t('common.validation.selectAtLeastOneItem'));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleToggleItem = (item: TransferOrderItem | Product): void => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((si) => {
        if (transferMode === 'order') {
          return 'id' in si && si.id === (item as TransferOrderItem).id;
        }
        return 'stockCode' in si && si.stockCode === (item as Product).stokKodu;
      });
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }
      if (transferMode === 'order') {
        const orderItem = item as TransferOrderItem;
        return [
          ...prev,
          {
            ...orderItem,
            transferQuantity: orderItem.remainingForImport || 0,
            isSelected: true,
          } as SelectedTransferOrderItem,
        ];
      } else {
        const product = item as Product;
        return [
          ...prev,
          {
            id: `stock-${product.stokKodu}`,
            stockCode: product.stokKodu,
            stockName: product.stokAdi,
            unit: product.olcuBr1,
            transferQuantity: 0,
            isSelected: true,
          } as SelectedTransferStockItem,
        ];
      }
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<SelectedTransferOrderItem | SelectedTransferStockItem>
  ): void => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        const itemIdMatch = 'id' in item && item.id === itemId;
        return itemIdMatch ? { ...item, ...updates } : item;
      })
    );
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) =>
      prev.filter((item) => {
        return !('id' in item && item.id === itemId);
      })
    );
  };

  const handleSave = async (): Promise<void> => {
    const formData = form.getValues();
    await createMutation.mutateAsync(formData);
  };

  const steps = [
    { label: t('transfer.create.steps.basicInfo') },
    {
      label:
        transferMode === 'order'
          ? t('transfer.create.steps.orderSelection')
          : t('transfer.create.steps.stockSelection'),
    },
  ];

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1TransferBasicInfo isFreeTransfer={transferMode === 'free'} />;
      case 2:
        if (transferMode === 'order') {
          return (
            <Step2TransferOrderSelection
              selectedItems={selectedItems as SelectedTransferOrderItem[]}
              onToggleItem={handleToggleItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          );
        }
        return (
          <Step2TransferStockSelection
            selectedItems={selectedItems as SelectedTransferStockItem[]}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <div>{t('transfer.create.unknownStep')}</div>;
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant={transferMode === 'order' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setTransferMode('order');
            setSelectedItems([]);
            if (currentStep > 1) setCurrentStep(1);
          }}
        >
          {t('transfer.create.mode.order')}
        </Badge>
        <Badge
          variant={transferMode === 'free' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setTransferMode('free');
            setSelectedItems([]);
            if (currentStep > 1) setCurrentStep(1);
          }}
        >
          {t('transfer.create.mode.free')}
        </Badge>
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
                    <Button type="button" onClick={handleNext}>
                      {t('common.next')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={createMutation.isPending || selectedItems.length === 0}
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
