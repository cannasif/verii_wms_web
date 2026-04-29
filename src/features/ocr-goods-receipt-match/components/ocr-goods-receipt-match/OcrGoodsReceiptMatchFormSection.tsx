import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup } from '@/services/lookup-types';
import type { CreateOcrGoodsReceiptCustomerStockMatchDto } from '../../types/ocr-goods-receipt-match.types';

interface OcrGoodsReceiptMatchFormSectionProps {
  formState: CreateOcrGoodsReceiptCustomerStockMatchDto;
  onFormStateChange: (updater: (prev: CreateOcrGoodsReceiptCustomerStockMatchDto) => CreateOcrGoodsReceiptCustomerStockMatchDto) => void;
  customerDialogOpen: boolean;
  onCustomerDialogOpenChange: (open: boolean) => void;
  stockDialogOpen: boolean;
  onStockDialogOpenChange: (open: boolean) => void;
  customerSummary: string | null;
  stockSummary: string | null;
  isEdit: boolean;
  savePending: boolean;
  loadingRecord: boolean;
  onSave: () => void;
  onReset: () => void;
  onSelectCustomerLabel: (label: string) => void;
  onSelectStockLabel: (label: string) => void;
}

export function OcrGoodsReceiptMatchFormSection({
  formState,
  onFormStateChange,
  customerDialogOpen,
  onCustomerDialogOpenChange,
  stockDialogOpen,
  onStockDialogOpenChange,
  customerSummary,
  stockSummary,
  isEdit,
  savePending,
  loadingRecord,
  onSave,
  onReset,
  onSelectCustomerLabel,
  onSelectStockLabel,
}: OcrGoodsReceiptMatchFormSectionProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('ocrGoodsReceiptMatch.fields.customer')} *</Label>
          <PagedLookupDialog<CustomerLookup>
            open={customerDialogOpen}
            onOpenChange={onCustomerDialogOpenChange}
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
              onFormStateChange((prev) => ({ ...prev, customerId: item.id }));
              onSelectCustomerLabel(`${item.cariKod} - ${item.cariIsim}`);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('ocrGoodsReceiptMatch.fields.ourStock')} *</Label>
          <PagedLookupDialog<StockLookup>
            open={stockDialogOpen}
            onOpenChange={onStockDialogOpenChange}
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
              onFormStateChange((prev) => ({ ...prev, ourStockId: item.id, unit: prev.unit || item.olcuBr1 || '' }));
              onSelectStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerStockCode">{t('ocrGoodsReceiptMatch.fields.customerStockCode')} *</Label>
          <Input
            id="customerStockCode"
            value={formState.customerStockCode}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerStockCode: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerStockCodePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerStockName">{t('ocrGoodsReceiptMatch.fields.customerStockName')}</Label>
          <Input
            id="customerStockName"
            value={formState.customerStockName || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerStockName: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerStockNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerBarcode">{t('ocrGoodsReceiptMatch.fields.customerBarcode')}</Label>
          <Input
            id="customerBarcode"
            value={formState.customerBarcode || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerBarcode: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerBarcodePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">{t('ocrGoodsReceiptMatch.fields.unit')}</Label>
          <Input
            id="unit"
            value={formState.unit || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, unit: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.unitPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('ocrGoodsReceiptMatch.fields.isActive')}</Label>
          <Select
            value={formState.isActive ? 'true' : 'false'}
            onValueChange={(value) => onFormStateChange((prev) => ({ ...prev, isActive: value === 'true' }))}
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
          onChange={(event) => onFormStateChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder={t('ocrGoodsReceiptMatch.fields.descriptionPlaceholder')}
          rows={4}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onSave} disabled={savePending || loadingRecord}>
          {(savePending || loadingRecord) ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isEdit ? t('common.update') : t('common.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          {t('common.clear')}
        </Button>
      </div>
    </>
  );
}
