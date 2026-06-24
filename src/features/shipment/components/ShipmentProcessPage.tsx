import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import { ProcessStockSelection } from '@/features/shared/components/ProcessStockSelection';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import type { Product } from '@/features/shared';
import {
  createShipmentFormSchema,
  type ShipmentFormData,
  type SelectedShipmentStockItem,
} from '../types/shipment';
import { shipmentApi } from '../api/shipment-api';
import { Step1ShipmentBasicInfo } from './steps/Step1ShipmentBasicInfo';

export function ShipmentProcessPage(): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shipment');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedShipmentStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('shipment.process.title'));
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
      toast.success(t('shipment.process.success'));
      navigate('/shipment/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('shipment.process.error'));
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
    { label: t('shipment.process.steps.stockSelection') },
  ];

  const labels = {
    stocks: t('shipment.process.stocks'),
    selectedItems: t('shipment.process.selectedItems'),
    selectedItemsCount: t('shipment.process.selectedItemsCount'),
    searchStocks: t('shipment.process.searchStocks'),
    searchItems: t('shipment.process.searchItems'),
    noSelectedItems: t('shipment.process.noSelectedItems'),
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
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('shipment.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('shipment.create.breadcrumb.module')}</span>
          </>
        }
        title={t('shipment.process.title')}
        description={t('shipment.process.subtitle')}
        actions={
          <span className="wms-ops-code-badge">{t('shipment.create.mode.stock')}</span>
        }
      >
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
              <Step1ShipmentBasicInfo variant="ops" />
            ) : (
              <div className="wms-ops-form wms-ops-list">
                <ProcessStockSelection
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  labels={labels}
                />
              </div>
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
                    disabled={!permission.canCreate || createMutation.isPending || validSelectedItems.length === 0}
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
