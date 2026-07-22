import { type FocusEvent, type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { PackageOpen, Trash2 } from 'lucide-react';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormMessage,
  OpsInput,
} from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import { useWarehouses } from '../../../hooks/useWarehouses';
import type {
  GoodsReceiptFormData,
  SelectedOrderItem,
  Warehouse,
} from '../../../types/goods-receipt';

const DEFAULT_SHELF_CODE = 'yer1';

interface SelectedOrderItemsPanelProps {
  selectedItems: SelectedOrderItem[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function SelectedOrderItemsPanel({
  selectedItems,
  onUpdateItem,
  onRemoveItem,
  variant = 'ops',
}: SelectedOrderItemsPanelProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const form = useFormContext<GoodsReceiptFormData>();
  const { control } = form;
  const { data: warehouses = [] } = useWarehouses();
  const isOps = variant === 'ops';
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;
  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : ' *';

  return (
    <div className={cn('space-y-6', isOps && 'wms-ops-selected-order-items')}>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="receiptDate"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel>
                {t('goodsReceipt.step2.receiptDate')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                <OpsInput type="date" {...field} />
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="documentNo"
          render={({ field }) => (
            <FormItem className={formItemClass}>
              <FormLabel title={t('goodsReceipt.step1.documentNoHint')}>
                {t('goodsReceipt.step2.documentNo')}
                {requiredMark}
              </FormLabel>
              <FormControl>
                <OpsInput
                  title={t('goodsReceipt.step1.documentNoHint')}
                  placeholder={t('goodsReceipt.step2.documentNoPlaceholder')}
                  inputMode="numeric"
                  maxLength={16}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '');
                    field.onChange(value);
                    if (value) {
                      form.clearErrors('documentNo');
                    }
                  }}
                />
              </FormControl>
              {fieldMessage}
            </FormItem>
          )}
        />
      </div>

      {selectedItems.length === 0 ? (
        <div className="wms-ops-panel-empty py-12">
          <PackageOpen className="size-10" aria-hidden />
          <p className="wms-ops-panel-empty__title">{t('goodsReceipt.step2.noSelectedItems')}</p>
          <p className="wms-ops-panel-empty__hint">{t('goodsReceipt.step2.selectOrderPrompt')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t('goodsReceipt.step2.selectedCount', { count: selectedItems.length })}
          </p>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <SelectedReceiptEntryRow
                key={item.id}
                item={item}
                warehouses={warehouses}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectedReceiptEntryRowProps {
  item: SelectedOrderItem;
  warehouses: Warehouse[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

function SelectedReceiptEntryRow({
  item,
  warehouses,
  onUpdateItem,
  onRemoveItem,
}: SelectedReceiptEntryRowProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const itemId = item.id || '';
  const [quantityValue, setQuantityValue] = useState(item.receiptQuantity?.toString() || '');
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const hasSerial = Boolean(item.serialNo?.trim());
  const warehouseName = warehouses.find((warehouse) => warehouse.depoKodu === item.warehouseId)?.depoIsmi;
  const selectedWarehouseLabel = item.warehouseId
    ? warehouseName
      ? `${warehouseName} (${item.warehouseId})`
      : String(item.warehouseId)
    : '';

  useEffect(() => {
    setQuantityValue(item.receiptQuantity?.toString() || '');
  }, [item.receiptQuantity]);

  const handleQuantityChange = (raw: string): void => {
    setQuantityValue(raw);
    if (raw === '') return;
    const quantity = parseFloat(raw);
    if (!Number.isNaN(quantity) && quantity >= 0) {
      onUpdateItem(itemId, { receiptQuantity: quantity });
    }
  };

  const handleQuantityBlur = (): void => {
    if (quantityValue === '') {
      setQuantityValue(item.receiptQuantity?.toString() || '');
    }
  };

  const handleQuantityFocus = (event: FocusEvent<HTMLInputElement>): void => {
    event.currentTarget.select();
  };

  return (
    <div className="wms-ops-receipt-entry-row">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold">
            {item.stockName || item.productName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="wms-ops-code-badge">{item.stockCode || item.productCode}</span>
            <span>•</span>
            <span className="font-mono">{item.siparisNo}</span>
            <span>•</span>
            <span>
              {t('goodsReceipt.orderDetails.ordered')}:{' '}
              <strong className="text-foreground">
                {item.quantity ?? item.remainingForImport ?? 0} {item.unit || ''}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1 sm:col-span-2 xl:col-span-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              {t('goodsReceipt.report.targetWarehouse')}
            </label>
            <OpsFieldShell className={warehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
              <PagedLookupDialog<Warehouse>
                variant="ops"
                open={warehouseLookupOpen}
                onOpenChange={setWarehouseLookupOpen}
                title={t('goodsReceipt.step1.selectWarehouse')}
                value={selectedWarehouseLabel}
                placeholder={t('goodsReceipt.step1.selectWarehouse')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.notFound')}
                triggerClassName={cn(OPS_FIELD_CLASS, 'h-9')}
                queryKey={['goods-receipt', 'warehouses', itemId || 'new']}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getWarehousesPaged(
                    { pageNumber, pageSize, search },
                    undefined,
                    { signal },
                  )
                }
                getKey={(warehouse) => warehouse.id.toString()}
                getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                onSelect={(warehouse) => {
                  onUpdateItem(itemId, { warehouseId: warehouse.depoKodu });
                }}
              />
            </OpsFieldShell>
          </div>

          <div className="space-y-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              {t('goodsReceipt.step2.quantity')}
            </label>
            <OpsInput
              type="number"
              min="0"
              value={quantityValue}
              onChange={(event) => handleQuantityChange(event.target.value)}
              onFocus={handleQuantityFocus}
              onBlur={handleQuantityBlur}
              className="h-9 text-right font-mono text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder={t('common.numericPlaceholder')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              {t('goodsReceipt.details.serialNo')}
            </label>
            <OpsInput
              value={item.serialNo || ''}
              onChange={(event) => onUpdateItem(itemId, { serialNo: event.target.value })}
              className="h-9 font-mono text-sm"
              placeholder={t('goodsReceipt.details.serialNoPlaceholder')}
            />
            {!hasSerial ? (
              <p className="text-[0.65rem] text-muted-foreground">
                {t('goodsReceipt.step2.serialOptionalHint')}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
              {t('goodsReceipt.step2.shelfCode')}
            </label>
            <OpsInput
              value={item.targetCellCode || DEFAULT_SHELF_CODE}
              onChange={(event) => onUpdateItem(itemId, { targetCellCode: event.target.value })}
              className="h-9 font-mono text-sm"
              placeholder={DEFAULT_SHELF_CODE}
            />
          </div>
        </div>

        <OpsActionButton
          type="button"
          variant="secondary"
          className="wms-ops-receipt-row__remove-btn shrink-0 self-start"
          aria-label={t('common.delete')}
          onClick={() => onRemoveItem(itemId)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </OpsActionButton>
      </div>
    </div>
  );
}
