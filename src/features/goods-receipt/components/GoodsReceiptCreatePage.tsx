import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createGoodsReceiptFormSchema,
  type SelectedOrderItem,
  type SelectedStockItem,
  type OrderItem,
  type Product,
  type GoodsReceiptFormData,
} from '../types/goods-receipt';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2OrderSelection } from './steps/Step2OrderSelection';
import { Step2StockSelection } from './steps/Step2StockSelection';

type ReceiptMode = 'order' | 'stock';

export function GoodsReceiptCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>('order');
  const [selectedItems, setSelectedItems] = useState<(SelectedOrderItem | SelectedStockItem)[]>([]);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.create.title'));
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
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GoodsReceiptFormData) => {
      return goodsReceiptApi.createGoodsReceipt(formData, selectedItems, receiptMode === 'stock');
    },
    onSuccess: () => {
      toast.success(t('goodsReceipt.create.success'));
      navigate('/goods-receipt/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('goodsReceipt.create.error')
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

  const handleToggleItem = (item: OrderItem | Product): void => {
    setSelectedItems((prev) => {
      if (receiptMode === 'order') {
        const existingIndex = prev.findIndex((si) => 'id' in si && si.id === (item as OrderItem).id);
        if (existingIndex >= 0) {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
        const orderItem = item as OrderItem;
        return [
          ...prev,
          {
            ...orderItem,
            receiptQuantity: orderItem.quantity || 0,
            isSelected: true,
          } as SelectedOrderItem,
        ];
      } else {
        const product = item as Product;
        return [
          ...prev,
          {
            id: `stock-${product.stokKodu}-${crypto.randomUUID()}`,
            stockCode: product.stokKodu,
            stockName: product.stokAdi,
            unit: product.olcuBr1,
            receiptQuantity: 0,
            isSelected: true,
          } as SelectedStockItem,
        ];
      }
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedOrderItem | SelectedStockItem>): void => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        const itemIdMatch = receiptMode === 'order' 
          ? ('id' in item && item.id === itemId)
          : ('id' in item && item.id === itemId);
        return itemIdMatch ? { ...item, ...updates } : item;
      })
    );
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => 
      prev.filter((item) => {
        if (receiptMode === 'order') {
          return !('id' in item && item.id === itemId);
        }
        return !('id' in item && item.id === itemId);
      })
    );
  };

  const handleSave = async (): Promise<void> => {
    const formData = form.getValues();
    await createMutation.mutateAsync(formData);
  };

  const steps = [
    { label: t('goodsReceipt.create.steps.basicInfo') },
    { label: receiptMode === 'order' 
        ? t('goodsReceipt.create.steps.orderSelection')
        : t('goodsReceipt.create.steps.stockSelection')
    },
  ];

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        if (receiptMode === 'order') {
          return (
            <Step2OrderSelection
              selectedItems={selectedItems as SelectedOrderItem[]}
              onToggleItem={handleToggleItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          );
        }
        return (
          <Step2StockSelection
            selectedItems={selectedItems as SelectedStockItem[]}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <div>{t('goodsReceipt.create.unknownStep')}</div>;
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant={receiptMode === 'order' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setReceiptMode('order');
            setSelectedItems([]);
            if (currentStep > 1) setCurrentStep(1);
          }}
        >
          {t('goodsReceipt.create.mode.order')}
        </Badge>
        <Badge
          variant={receiptMode === 'stock' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setReceiptMode('stock');
            setSelectedItems([]);
            if (currentStep > 1) setCurrentStep(1);
          }}
        >
          {t('goodsReceipt.create.mode.stock')}
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
