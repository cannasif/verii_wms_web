import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import {
  createSubcontractingFormSchema,
  type SelectedSubcontractingOrderItem,
  type SubcontractingOrderItem,
  type SubcontractingFormData,
} from '../types/subcontracting';
import { subcontractingApi } from '../api/subcontracting-api';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Step1SubcontractingBasicInfo } from './steps/Step1SubcontractingBasicInfo';
import { Step2SubcontractingOrderSelection } from './steps/Step2SubcontractingOrderSelection';

export function SubcontractingIssueCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedSubcontractingOrderItem[]>([]);

  useEffect(() => {
    setPageTitle(t('subcontracting.issue.create.title', 'Yeni Fason Çıkış Emri'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const schema = useMemo(() => createSubcontractingFormSchema(t), [t]);

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
    mutationFn: async (formData: SubcontractingFormData) => {
      return subcontractingApi.createSubcontractingIssue(formData, selectedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-orders'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-order-items'] });
      queryClient.invalidateQueries({ queryKey: ['subcontracting-issue-headers'] });
      toast.success(t('subcontracting.issue.create.success', 'Fason çıkış emri başarıyla oluşturuldu'));
      navigate('/subcontracting/issue/list');
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t('subcontracting.issue.create.error', 'Fason çıkış emri oluşturulurken bir hata oluştu')
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

  const handleToggleItem = (item: SubcontractingOrderItem): void => {
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
        } as SelectedSubcontractingOrderItem,
      ];
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<SelectedSubcontractingOrderItem>
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
    { label: t('subcontracting.create.steps.basicInfo', 'Temel Bilgiler') },
    {
      label: t('subcontracting.create.steps.orderSelection', 'Sipariş Seçimi'),
    },
  ];

  const renderStepContent = (): ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1SubcontractingBasicInfo />;
      case 2:
        return (
          <Step2SubcontractingOrderSelection
            type="issue"
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <div>{t('subcontracting.create.unknownStep', 'Bilinmeyen adım')}</div>;
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

