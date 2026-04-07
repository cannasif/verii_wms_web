import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell, ProcessStockSelection } from '@/components/shared';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import {
  createShipmentFormSchema,
  type ShipmentFormData,
  type SelectedShipmentStockItem,
} from '../types/shipment';
import { shipmentApi } from '../api/shipment-api';
import { Step1ShipmentBasicInfo } from './steps/Step1ShipmentBasicInfo';

export function ShipmentProcessPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedShipmentStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('shipment.process.title', { defaultValue: 'Emirsiz Sevkiyat İşlemi' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const schema = useMemo(() => createShipmentFormSchema(t), [t]);

  const form = useForm<ShipmentFormData>({
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

  const validSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0),
    [selectedItems],
  );

  const createMutation = useMutation({
    mutationFn: async (formData: ShipmentFormData) => shipmentApi.processShipment(formData, validSelectedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipmentHeaders'] });
      queryClient.invalidateQueries({ queryKey: ['shipmentHeadersPaged'] });
      toast.success(t('shipment.process.success', { defaultValue: 'Sevkiyat işlemi oluşturuldu' }));
      navigate('/shipment/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('shipment.process.error', { defaultValue: 'Sevkiyat işlemi oluşturulamadı' }));
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

  const handleToggleItem = (item: Product): void => {
    setSelectedItems((prev) => [
      ...prev,
      {
        id: `stock-${item.stokKodu}-${crypto.randomUUID()}`,
        stockId: item.id,
        yapKodId: undefined,
        stockCode: item.stokKodu,
        stockName: item.stokAdi,
        unit: item.olcuBr1,
        transferQuantity: 0,
        isSelected: true,
      },
    ]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedShipmentStockItem>): void => {
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

    await createMutation.mutateAsync(form.getValues());
  };

  const steps = [
    { label: t('shipment.create.steps.basicInfo') },
    { label: t('shipment.process.steps.stockSelection', { defaultValue: 'Stok Seçimi' }) },
  ];

  const labels = {
    stocks: t('shipment.process.stocks', { defaultValue: 'Stoklar' }),
    selectedItems: t('shipment.process.selectedItems', { defaultValue: 'Seçilen Kalemler' }),
    selectedItemsCount: t('shipment.process.selectedItemsCount', { defaultValue: '{{count}} kalem' }),
    searchStocks: t('shipment.process.searchStocks', { defaultValue: 'Stok kodu veya adı ile ara...' }),
    searchItems: t('shipment.process.searchItems', { defaultValue: 'Seçilenleri ara...' }),
    noSelectedItems: t('shipment.process.noSelectedItems', { defaultValue: 'Seçili stok bulunmamaktadır' }),
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

  return (
    <div className="crm-page space-y-6">
      <Badge variant="secondary" className="mb-4">
        {t('shipment.process.badge', { defaultValue: 'Emirsiz Process' })}
      </Badge>

      <Breadcrumb
        items={steps.map((step, index) => ({
          label: step.label,
          isActive: index + 1 === currentStep,
        }))}
        className="mb-4"
      />

      <FormPageShell
        title={t('shipment.process.title', { defaultValue: 'Emirsiz Sevkiyat İşlemi' })}
        description={t('shipment.process.subtitle', { defaultValue: 'Header + ImportLine + Route mantığında sevkiyat işlemi oluşturun.' })}
      >
        <Form {...form}>
          <form className="crm-page space-y-6">
            {currentStep === 1 ? (
              <Step1ShipmentBasicInfo />
            ) : (
              <ProcessStockSelection
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                labels={labels}
              />
            )}

            <div className="flex justify-between border-t pt-6">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                {t('common.previous')}
              </Button>
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext}>
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSave} disabled={createMutation.isPending || validSelectedItems.length === 0}>
                    {createMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormPageShell>
    </div>
  );
}
