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
import { Step1ShipmentBasicInfo } from './steps/Step1ShipmentBasicInfo';
import { Step2ShipmentOrderSelection } from './steps/Step2ShipmentOrderSelection';

export function ShipmentCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedShipmentOrderItem[]>([]);

  useEffect(() => {
    setPageTitle(t('shipment.create.title', 'Yeni Sevkiyat Emri'));
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
      return shipmentApi.createShipment(formData, selectedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-order-items'] });
      toast.success(t('shipment.create.success', 'Sevkiyat emri başarıyla oluşturuldu'));
      navigate('/shipment/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('shipment.create.error', 'Sevkiyat emri oluşturulurken bir hata oluştu')
      );
    },
  });

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep === 2 && selectedItems.length === 0) {
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

  const handleSave = async (): Promise<void> => {
    const formData = form.getValues();
    await createMutation.mutateAsync(formData);
  };

  const steps = [
    { label: t('shipment.create.steps.basicInfo', 'Temel Bilgiler') },
    {
      label: t('shipment.create.steps.orderSelection', 'Sipariş Seçimi'),
    },
  ];

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
        return <div>{t('shipment.create.unknownStep', 'Bilinmeyen adım')}</div>;
    }
  };

  return (
    <div className="space-y-6">
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
              {renderStepContent()}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  {t('common.previous', 'Önceki')}
                </Button>
                <div className="flex gap-2">
                  {currentStep < steps.length ? (
                    <Button type="button" onClick={handleNext}>
                      {t('common.next', 'Sonraki')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={createMutation.isPending || selectedItems.length === 0}
                    >
                      {createMutation.isPending ? t('common.saving', 'Kaydediliyor...') : t('common.save', 'Kaydet')}
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






