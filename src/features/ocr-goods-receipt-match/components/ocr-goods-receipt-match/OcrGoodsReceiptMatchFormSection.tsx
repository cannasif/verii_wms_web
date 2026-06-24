import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput, OpsTextarea } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { SelectItem } from '@/components/ui/select';
import {
  MasterDataOpsFormField,
  MasterDataOpsSection,
  MasterDataOpsSelect,
} from '@/features/shared';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { CustomerLookup, StockLookup } from '@/features/shared/api/lookup-types';
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
    <MasterDataOpsSection title={t('ocrGoodsReceiptMatch.title')}>
      <div className="grid gap-5 lg:grid-cols-2">
        <MasterDataOpsFormField label={`${t('ocrGoodsReceiptMatch.fields.customer')} *`}>
          <PagedLookupDialog<CustomerLookup>
            variant="ops"
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
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={`${t('ocrGoodsReceiptMatch.fields.ourStock')} *`}>
          <PagedLookupDialog<StockLookup>
            variant="ops"
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
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={`${t('ocrGoodsReceiptMatch.fields.customerStockCode')} *`} htmlFor="customerStockCode">
          <OpsInput
            id="customerStockCode"
            value={formState.customerStockCode}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerStockCode: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerStockCodePlaceholder')}
          />
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={t('ocrGoodsReceiptMatch.fields.customerStockName')} htmlFor="customerStockName">
          <OpsInput
            id="customerStockName"
            value={formState.customerStockName || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerStockName: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerStockNamePlaceholder')}
          />
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={t('ocrGoodsReceiptMatch.fields.customerBarcode')} htmlFor="customerBarcode">
          <OpsInput
            id="customerBarcode"
            value={formState.customerBarcode || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, customerBarcode: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.customerBarcodePlaceholder')}
          />
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={t('ocrGoodsReceiptMatch.fields.unit')} htmlFor="unit">
          <OpsInput
            id="unit"
            value={formState.unit || ''}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, unit: event.target.value }))}
            placeholder={t('ocrGoodsReceiptMatch.fields.unitPlaceholder')}
          />
        </MasterDataOpsFormField>

        <MasterDataOpsFormField label={t('ocrGoodsReceiptMatch.fields.isActive')}>
          <MasterDataOpsSelect
            value={formState.isActive ? 'true' : 'false'}
            onValueChange={(value) => onFormStateChange((prev) => ({ ...prev, isActive: value === 'true' }))}
          >
            <SelectItem value="true">{t('ocrGoodsReceiptMatch.options.active')}</SelectItem>
            <SelectItem value="false">{t('ocrGoodsReceiptMatch.options.passive')}</SelectItem>
          </MasterDataOpsSelect>
        </MasterDataOpsFormField>
      </div>

      <MasterDataOpsFormField label={t('ocrGoodsReceiptMatch.fields.description')} htmlFor="description" className="mt-5">
        <OpsTextarea
          id="description"
          value={formState.description || ''}
          onChange={(event) => onFormStateChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder={t('ocrGoodsReceiptMatch.fields.descriptionPlaceholder')}
          rows={4}
        />
      </MasterDataOpsFormField>

      <div className="wms-ops-actions mt-5 flex flex-wrap gap-3">
        <OpsActionButton type="button" variant="primary" onClick={onSave} disabled={savePending || loadingRecord}>
          {(savePending || loadingRecord) ? <Loader2 className="size-4 animate-spin" /> : null}
          {isEdit ? t('common.update') : t('common.save')}
        </OpsActionButton>
        <OpsActionButton type="button" variant="secondary" onClick={onReset}>
          {t('common.clear')}
        </OpsActionButton>
      </div>
    </MasterDataOpsSection>
  );
}
