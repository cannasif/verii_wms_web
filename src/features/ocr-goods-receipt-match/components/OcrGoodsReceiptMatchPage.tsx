import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { ocrGoodsReceiptMatchApi } from '../api/ocr-goods-receipt-match.api';
import type {
  CreateOcrGoodsReceiptCustomerStockMatchDto,
  OcrGoodsReceiptCustomerStockMatchDto,
} from '../types/ocr-goods-receipt-match.types';
import { buildCustomerLabel, buildStockLabel } from './ocr-goods-receipt-match/shared';
import { OcrGoodsReceiptMatchGuidanceCard } from './ocr-goods-receipt-match/OcrGoodsReceiptMatchGuidanceCard';
import { OcrGoodsReceiptMatchFormSection } from './ocr-goods-receipt-match/OcrGoodsReceiptMatchFormSection';

export function OcrGoodsReceiptMatchPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  const [formState, setFormState] = useState<CreateOcrGoodsReceiptCustomerStockMatchDto>({
    branchCode: '0',
    customerId: 0,
    customerStockCode: '',
    customerStockName: '',
    customerBarcode: '',
    ourStockId: 0,
    unit: '',
    isActive: true,
    description: '',
  });
  const [currentRecord, setCurrentRecord] = useState<OcrGoodsReceiptCustomerStockMatchDto | null>(null);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedStockLabel, setSelectedStockLabel] = useState('');

  const isEdit = Boolean(currentRecord?.id);

  useEffect(() => {
    setPageTitle(t('ocrGoodsReceiptMatch.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getByIdMutation = useMutation({
    mutationFn: (id: number) => ocrGoodsReceiptMatchApi.getById(id),
    onSuccess: (data) => hydrateForm(data),
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) return;
    if (currentRecord?.id === id || getByIdMutation.isPending) return;
    getByIdMutation.mutate(id);
  }, [currentRecord?.id, getByIdMutation, searchParams]);

  const saveMutation = useMutation({
    mutationFn: async (dto: CreateOcrGoodsReceiptCustomerStockMatchDto) => (
      currentRecord?.id
        ? ocrGoodsReceiptMatchApi.update(currentRecord.id, dto)
        : ocrGoodsReceiptMatchApi.create(dto)
    ),
    onSuccess: (data) => {
      hydrateForm(data);
      setSearchParams({ id: String(data.id) }, { replace: true });
      toast.success(isEdit ? t('ocrGoodsReceiptMatch.messages.updated') : t('ocrGoodsReceiptMatch.messages.created'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  function hydrateForm(data: OcrGoodsReceiptCustomerStockMatchDto): void {
    setCurrentRecord(data);
    setFormState({
      branchCode: data.branchCode || '0',
      customerId: data.customerId,
      customerStockCode: data.customerStockCode,
      customerStockName: data.customerStockName || '',
      customerBarcode: data.customerBarcode || '',
      ourStockId: data.ourStockId,
      unit: data.unit || '',
      isActive: data.isActive,
      description: data.description || '',
    });
    setSelectedCustomerLabel(buildCustomerLabel(data.customerCode, data.customerName) || '');
    setSelectedStockLabel(buildStockLabel(data.ourStockCode, data.ourStockName) || '');
  }

  function handleReset(): void {
    setCurrentRecord(null);
    setSelectedCustomerLabel('');
    setSelectedStockLabel('');
    setSearchParams({}, { replace: true });
    setFormState({
      branchCode: '0',
      customerId: 0,
      customerStockCode: '',
      customerStockName: '',
      customerBarcode: '',
      ourStockId: 0,
      unit: '',
      isActive: true,
      description: '',
    });
  }

  function handleSave(): void {
    if (!formState.customerId) {
      toast.error(t('ocrGoodsReceiptMatch.messages.customerRequired'));
      return;
    }
    if (!formState.customerStockCode.trim()) {
      toast.error(t('ocrGoodsReceiptMatch.messages.customerStockCodeRequired'));
      return;
    }
    if (!formState.ourStockId) {
      toast.error(t('ocrGoodsReceiptMatch.messages.ourStockRequired'));
      return;
    }

    saveMutation.mutate({
      ...formState,
      customerStockCode: formState.customerStockCode.trim(),
      customerStockName: formState.customerStockName?.trim() || null,
      customerBarcode: formState.customerBarcode?.trim() || null,
      unit: formState.unit?.trim() || null,
      description: formState.description?.trim() || null,
    });
  }

  const customerSummary = useMemo(
    () => buildCustomerLabel(currentRecord?.customerCode, currentRecord?.customerName) || selectedCustomerLabel,
    [currentRecord?.customerCode, currentRecord?.customerName, selectedCustomerLabel],
  );
  const stockSummary = useMemo(
    () => buildStockLabel(currentRecord?.ourStockCode, currentRecord?.ourStockName) || selectedStockLabel,
    [currentRecord?.ourStockCode, currentRecord?.ourStockName, selectedStockLabel],
  );

  return (
    <div className="crm-page space-y-6">
      <Badge variant="secondary">{t('ocrGoodsReceiptMatch.badge')}</Badge>

      <FormPageShell title={t('ocrGoodsReceiptMatch.title')} description={t('ocrGoodsReceiptMatch.description')}>
        <div className="space-y-6">
          <OcrGoodsReceiptMatchGuidanceCard />

          <OcrGoodsReceiptMatchFormSection
            formState={formState}
            onFormStateChange={(updater) => setFormState(updater)}
            customerDialogOpen={customerDialogOpen}
            onCustomerDialogOpenChange={setCustomerDialogOpen}
            stockDialogOpen={stockDialogOpen}
            onStockDialogOpenChange={setStockDialogOpen}
            customerSummary={customerSummary}
            stockSummary={stockSummary}
            isEdit={isEdit}
            savePending={saveMutation.isPending}
            loadingRecord={getByIdMutation.isPending}
            onSave={handleSave}
            onReset={handleReset}
            onSelectCustomerLabel={setSelectedCustomerLabel}
            onSelectStockLabel={setSelectedStockLabel}
          />
        </div>
      </FormPageShell>
    </div>
  );
}
