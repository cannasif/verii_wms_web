import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { YapKodLookup } from '@/features/shared/api/lookup-types';
import { cn } from '@/lib/utils';
import type { ShipmentOrderItem, SelectedShipmentOrderItem } from '../../../types/shipment';

interface ShipmentItemRowProps {
  item: ShipmentOrderItem;
  selectedItem?: SelectedShipmentOrderItem;
  onUpdateItem: (itemId: string, updates: Partial<SelectedShipmentOrderItem>) => void;
  onToggleItem: (item: ShipmentOrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function ShipmentItemRow({
  item,
  selectedItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: ShipmentItemRowProps): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const isOps = variant === 'ops';
  const [value, setValue] = useState(selectedItem?.transferQuantity?.toString() || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [yapKodLookupOpen, setYapKodLookupOpen] = useState(false);

  useEffect(() => {
    setValue(selectedItem?.transferQuantity?.toString() || '');
  }, [selectedItem?.transferQuantity]);

  const handleChange = (newValue: string): void => {
    setValue(newValue);
    const quantity = parseFloat(newValue);
    const itemId = item.id || '';

    if (!isNaN(quantity) && quantity > 0) {
      if (!selectedItem) {
        onToggleItem(item);
        setTimeout(() => onUpdateItem(itemId, { transferQuantity: quantity }), 0);
      } else {
        onUpdateItem(itemId, { transferQuantity: quantity });
      }
    } else if (newValue === '' || quantity === 0) {
      if (selectedItem) {
        onRemoveItem(itemId);
      }
    }
  };

  const handleDetailChange = (
    field: keyof SelectedShipmentOrderItem,
    val: string | number,
  ): void => {
    if (!selectedItem) return;
    const itemId = item.id || '';
    onUpdateItem(itemId, { [field]: val } as Partial<SelectedShipmentOrderItem>);
  };

  const quantity = parseFloat(value) || 0;
  const itemQuantity = item.remainingForImport ?? 0;
  const progress = Math.min((quantity / itemQuantity) * 100, 100);
  const isOver = quantity > itemQuantity;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-2 transition-all sm:p-3',
        isOps && 'wms-ops-receipt-row',
        quantity > 0 && (isOps ? 'wms-ops-receipt-row--active' : 'border-primary/50 bg-primary/5'),
        isOver && (isOps ? 'wms-ops-receipt-row--over' : 'border-destructive'),
      )}
    >
      <div
        className={cn(
          'absolute bottom-0 left-0 h-0.5 rounded-b-lg transition-all duration-500',
          isOps ? 'wms-ops-receipt-row__progress' : 'bg-primary',
        )}
        style={{ width: `${progress}%`, opacity: quantity > 0 ? 1 : 0 }}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start gap-2">
            <h4 className="min-w-0 flex-1 text-sm font-semibold">{item.stockName}</h4>
            {isOver && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                {t('common.over')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <Badge variant="outline" className={cn('w-fit font-mono text-xs', isOps && 'wms-ops-code-badge rounded-none')}>
              {item.stockCode}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <span>
              {t('shipment.step2.ordered')}:{' '}
              <strong className="text-foreground">{item.orderedQty}</strong>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch justify-between gap-2 border-t pt-2 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0">
          <div className="flex flex-1 items-center gap-1.5 sm:flex-initial">
            {isOps ? (
              <OpsInput
                type="number"
                min="0"
                value={value}
                onChange={(event) => handleChange(event.target.value)}
                className={cn(
                  'w-full text-right font-mono sm:w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                  isOver && 'border-destructive',
                )}
                placeholder={t('common.numericPlaceholder')}
              />
            ) : (
              <Input
                type="number"
                min="0"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className={cn(
                  'h-8 w-full text-right font-mono text-sm sm:w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                  isOver && 'border-destructive focus-visible:ring-destructive',
                )}
                placeholder={t('common.numericPlaceholder')}
              />
            )}
          </div>
          {isOps ? (
            <OpsActionButton
              type="button"
              variant="secondary"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </OpsActionButton>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className={cn('mt-3 border-t pt-3', isOps && 'border-[color-mix(in_oklab,var(--wms-ops-accent)_18%,var(--wms-ops-card-border))]')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor={`serial-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('shipment.details.serialNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`serial-${item.id || ''}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.serialNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`serial-${item.id || ''}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.serialNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('shipment.details.lotNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`lot-${item.id || ''}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.lotNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`lot-${item.id || ''}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.lotNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('shipment.details.batchNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`batch-${item.id || ''}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.batchNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`batch-${item.id || ''}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('shipment.details.batchNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`config-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('shipment.details.configCode')}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PagedLookupDialog<YapKodLookup>
                    open={yapKodLookupOpen}
                    onOpenChange={setYapKodLookupOpen}
                    title={t('shipment.details.configCode')}
                    description={item.stockName || item.stockCode || ''}
                    value={selectedItem?.configCode || ''}
                    placeholder={
                      selectedItem?.stockId
                        ? t('shipment.details.configCodePlaceholder')
                        : t('common.selectStockFirst')
                    }
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    disabled={!selectedItem?.stockId}
                    variant={variant}
                    queryKey={['shipment', 'yapkod', selectedItem?.stockId ?? item.id ?? 'new']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getYapKodlarPaged(
                        { pageNumber, pageSize, search },
                        { stockId: selectedItem?.stockId },
                        { signal },
                      )
                    }
                    getKey={(yapKod) => yapKod.id.toString()}
                    getLabel={(yapKod) => `${yapKod.yapKod}${yapKod.yapAcik ? ` - ${yapKod.yapAcik}` : ''}`}
                    onSelect={(yapKod) => onUpdateItem(item.id || '', { configCode: yapKod.yapKod, yapKodId: yapKod.id })}
                  />
                </div>
                {selectedItem?.configCode ? (
                  isOps ? (
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      className="h-9 shrink-0"
                      onClick={() => onUpdateItem(item.id || '', { configCode: '', yapKodId: undefined })}
                    >
                      {t('common.clear')}
                    </OpsActionButton>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => onUpdateItem(item.id || '', { configCode: '', yapKodId: undefined })}
                    >
                      {t('common.clear')}
                    </Button>
                  )
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedItem?.stockId
                  ? (selectedItem?.configCode || t('shipment.details.configCodePlaceholder'))
                  : t('common.selectStockFirst')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
