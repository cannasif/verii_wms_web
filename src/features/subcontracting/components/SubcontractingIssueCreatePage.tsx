import { type ReactElement, useState, useEffect, useMemo } from 'react';
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
  createSubcontractingFormSchema,
  type SelectedSubcontractingOrderItem,
  type SubcontractingOrderItem,
  type SubcontractingFormData,
  type SelectedSubcontractingStockItem,
} from '../types/subcontracting';
import { subcontractingApi } from '../api/subcontracting-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';
import { Step2SubcontractingOrderSelection } from './steps/Step2SubcontractingOrderSelection';
import { ProcessStockSelection } from '@/features/shared/components/ProcessStockSelection';
import type { Product } from '@/features/shared';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function SubcontractingIssueCreatePage(): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.issue');
  const [currentStep, setCurrentStep] = useState(1);
  const [createMode, setCreateMode] = useState<'order' | 'stock'>('order');
  const [selectedItems, setSelectedItems] = useState<SelectedSubcontractingOrderItem[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedSubcontractingStockItem[]>([]);

  useEffect(() => {
    setPageTitle(t('subcontracting.issue.create.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const schema = useMemo(() => createSubcontractingFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    shouldFocusError: false,
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

  const createMutation = useMutation({
    mutationFn: async (formData: SubcontractingFormData) =>
      createMode === 'order'
        ? subcontractingApi.createSubcontractingIssue(formData, selectedItems)
        : subcontractingApi.createStockBasedSubcontractingIssue(formData, selectedStockItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-orders'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-order-items'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-headers'] });
      toast.success(t('subcontracting.issue.create.success'));
      navigate('/subcontracting/issue/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('subcontracting.issue.create.error'));
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

  const handleToggleItem = (item: SubcontractingOrderItem): void => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((si) => si.id === item.id);
      if (existingIndex >= 0) return prev.filter((_, idx) => idx !== existingIndex);
      return [...prev, { ...item, transferQuantity: item.remainingForImport || 0, isSelected: true } as SelectedSubcontractingOrderItem];
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SelectedSubcontractingOrderItem>): void => {
    setSelectedItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleToggleStockItem = (item: Product): void => {
    setSelectedStockItems((prev) => [...prev, { id: `stock-${item.stokKodu}-${crypto.randomUUID()}`, stockId: item.id, yapKodId: undefined, stockCode: item.stokKodu, stockName: item.stokAdi, unit: item.olcuBr1, transferQuantity: 0, isSelected: true }]);
  };

  const handleUpdateStockItem = (itemId: string, updates: Partial<SelectedSubcontractingStockItem>): void => {
    setSelectedStockItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const handleRemoveStockItem = (itemId: string): void => {
    setSelectedStockItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = async (): Promise<void> => {
    await createMutation.mutateAsync(form.getValues());
  };

  const steps = [
    { label: t('subcontracting.create.steps.basicInfo') },
    { label: createMode === 'order' ? t('subcontracting.create.steps.orderSelection') : t('subcontracting.process.steps.stockSelection') },
  ];

  const stockLabels = {
    stocks: t('subcontracting.process.stocks'),
    selectedItems: t('subcontracting.process.selectedItems'),
    selectedItemsCount: t('subcontracting.process.selectedItemsCount'),
    searchStocks: t('subcontracting.process.searchStocks'),
    searchItems: t('subcontracting.process.searchItems'),
    noSelectedItems: t('subcontracting.process.noSelectedItems'),
    unit: t('common.unit'),
    serialNo: t('subcontracting.details.serialNo'),
    serialNoPlaceholder: t('subcontracting.details.serialNoPlaceholder'),
    serialNo2: t('subcontracting.details.serialNo2'),
    serialNo2Placeholder: t('subcontracting.details.serialNo2Placeholder'),
    lotNo: t('subcontracting.details.lotNo'),
    lotNoPlaceholder: t('subcontracting.details.lotNoPlaceholder'),
    batchNo: t('subcontracting.details.batchNo'),
    batchNoPlaceholder: t('subcontracting.details.batchNoPlaceholder'),
    configCode: t('subcontracting.details.configCode'),
    configCodePlaceholder: t('subcontracting.details.configCodePlaceholder'),
  };

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>}
        title={t('subcontracting.issue.create.title')}
        description={t('subcontracting.issue.create.subtitle')}
        actions={
          <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as 'order' | 'stock')} className="w-full sm:w-auto">
            <TabsList className={cn('wms-ops-tabs w-full sm:w-auto', createMode === 'order' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock')}>
              <span className="wms-ops-tab-indicator" aria-hidden />
              <TabsTrigger value="order" className="wms-ops-tab gap-1.5"><FileText className="size-3.5" />{t('subcontracting.create.mode.order')}</TabsTrigger>
              <TabsTrigger value="stock" className="wms-ops-tab gap-1.5"><Package className="size-3.5" />{t('subcontracting.create.mode.stock')}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <Breadcrumb items={steps.map((step, index) => ({ label: step.label, isActive: index + 1 === currentStep }))} className="wms-ops-steps mb-6" />
        <form className="space-y-6">
          <fieldset disabled={!permission.canCreate} className={!permission.canCreate ? 'pointer-events-none opacity-75' : undefined}>
            {currentStep === 1 ? (
              <Step1SubcontractingBasicInfo permissionCode="wms.subcontracting.issue.quantity-policy" documentSeriesOperationType="SIT" variant="ops" />
            ) : createMode === 'order' ? (
              <Step2SubcontractingOrderSelection type="issue" variant="ops" selectedItems={selectedItems} onToggleItem={handleToggleItem} onUpdateItem={handleUpdateItem} onRemoveItem={handleRemoveItem} />
            ) : (
              <div className="wms-ops-form wms-ops-list">
                <ProcessStockSelection selectedItems={selectedStockItems} onToggleItem={handleToggleStockItem} onUpdateItem={handleUpdateStockItem} onRemoveItem={handleRemoveStockItem} labels={stockLabels} />
              </div>
            )}
            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton type="button" variant="secondary" onClick={handlePrevious} disabled={currentStep === 1}>
                <ChevronLeft className="size-3.5" aria-hidden />{t('common.previous')}
              </OpsActionButton>
              <div className="flex gap-3">
                {currentStep < steps.length ? (
                  <OpsActionButton type="button" variant="primary" onClick={handleNext} disabled={!permission.canCreate}>
                    {t('common.next')}<ChevronRight className="size-3.5" aria-hidden />
                  </OpsActionButton>
                ) : (
                  <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={!permission.canCreate || createMutation.isPending || (createMode === 'order' ? selectedItems.length === 0 : selectedStockItems.length === 0)}>
                    {createMutation.isPending ? t('common.saving') : t('common.save')}<ChevronRight className="size-3.5" aria-hidden />
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
