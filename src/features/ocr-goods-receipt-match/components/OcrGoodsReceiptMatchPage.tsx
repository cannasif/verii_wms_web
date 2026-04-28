import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup } from '@/services/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { ocrGoodsReceiptMatchApi } from '../api/ocr-goods-receipt-match.api';
import type {
  CreateOcrGoodsReceiptCustomerStockMatchDto,
  OcrGoodsReceiptCustomerStockMatchDto,
} from '../types/ocr-goods-receipt-match.types';

function buildCustomerLabel(code?: string | null, name?: string | null): string | null {
  return [code, name].filter(Boolean).join(' - ') || null;
}

function buildStockLabel(code?: string | null, name?: string | null): string | null {
  return [code, name].filter(Boolean).join(' - ') || null;
}

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
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
            <div className="font-semibold">{t('ocrGoodsReceiptMatch.guidance.title')}</div>
            <div className="mt-1">{t('ocrGoodsReceiptMatch.guidance.line1')}</div>
            <div>{t('ocrGoodsReceiptMatch.guidance.line2')}</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('ocrGoodsReceiptMatch.fields.customer')} *</Label>
              <PagedLookupDialog<CustomerLookup>
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                title={t('ocrGoodsReceiptMatch.customerLookup.title')}
                description={t('ocrGoodsReceiptMatch.customerLookup.description')}
                value={customerSummary}
                placeholder={t('ocrGoodsReceiptMatch.fields.customerPlaceholder')}
                searchPlaceholder={t('ocrGoodsReceiptMatch.customerLookup.searchPlaceholder')}
                queryKey={['ocr-gr-match', 'customers']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => {
                  setFormState((prev) => ({ ...prev, customerId: item.id }));
                  setSelectedCustomerLabel(`${item.cariKod} - ${item.cariIsim}`);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ocrGoodsReceiptMatch.fields.ourStock')} *</Label>
              <PagedLookupDialog<StockLookup>
                open={stockDialogOpen}
                onOpenChange={setStockDialogOpen}
                title={t('ocrGoodsReceiptMatch.stockLookup.title')}
                description={t('ocrGoodsReceiptMatch.stockLookup.description')}
                value={stockSummary}
                placeholder={t('ocrGoodsReceiptMatch.fields.ourStockPlaceholder')}
                searchPlaceholder={t('ocrGoodsReceiptMatch.stockLookup.searchPlaceholder')}
                queryKey={['ocr-gr-match', 'stocks']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                onSelect={(item) => {
                  setFormState((prev) => ({ ...prev, ourStockId: item.id, unit: prev.unit || item.olcuBr1 || '' }));
                  setSelectedStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerStockCode">{t('ocrGoodsReceiptMatch.fields.customerStockCode')} *</Label>
              <Input
                id="customerStockCode"
                value={formState.customerStockCode}
                onChange={(event) => setFormState((prev) => ({ ...prev, customerStockCode: event.target.value }))}
                placeholder={t('ocrGoodsReceiptMatch.fields.customerStockCodePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerStockName">{t('ocrGoodsReceiptMatch.fields.customerStockName')}</Label>
              <Input
                id="customerStockName"
                value={formState.customerStockName || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, customerStockName: event.target.value }))}
                placeholder={t('ocrGoodsReceiptMatch.fields.customerStockNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerBarcode">{t('ocrGoodsReceiptMatch.fields.customerBarcode')}</Label>
              <Input
                id="customerBarcode"
                value={formState.customerBarcode || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, customerBarcode: event.target.value }))}
                placeholder={t('ocrGoodsReceiptMatch.fields.customerBarcodePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">{t('ocrGoodsReceiptMatch.fields.unit')}</Label>
              <Input
                id="unit"
                value={formState.unit || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
                placeholder={t('ocrGoodsReceiptMatch.fields.unitPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ocrGoodsReceiptMatch.fields.isActive')}</Label>
              <Select
                value={formState.isActive ? 'true' : 'false'}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, isActive: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('ocrGoodsReceiptMatch.options.active')}</SelectItem>
                  <SelectItem value="false">{t('ocrGoodsReceiptMatch.options.passive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('ocrGoodsReceiptMatch.fields.description')}</Label>
            <Textarea
              id="description"
              value={formState.description || ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t('ocrGoodsReceiptMatch.fields.descriptionPlaceholder')}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || getByIdMutation.isPending}>
              {(saveMutation.isPending || getByIdMutation.isPending) ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isEdit ? t('common.update') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              {t('common.clear')}
            </Button>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
