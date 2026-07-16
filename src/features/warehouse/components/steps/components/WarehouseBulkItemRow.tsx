import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { YapKodLookup } from '@/features/shared/api/lookup-types';
import type { SelectedWarehouseStockItem, WarehouseStockItem } from '../../../types/warehouse';

interface WarehouseBulkItemRowProps {
  item: WarehouseStockItem;
  selectedItem?: SelectedWarehouseStockItem;
  sourceWarehouseCode?: string;
  targetWarehouseCode?: string;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseStockItem>) => void;
  onToggleItem: (item: WarehouseStockItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function WarehouseBulkItemRow({
  item,
  selectedItem,
  sourceWarehouseCode,
  targetWarehouseCode,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: WarehouseBulkItemRowProps): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
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
    const itemId = item.id;

    if (!isNaN(quantity) && quantity > 0) {
      if (!selectedItem) {
        onToggleItem(item);
        setTimeout(() => onUpdateItem(itemId, { transferQuantity: quantity }), 0);
      } else {
        onUpdateItem(itemId, { transferQuantity: quantity });
      }
    } else if (quantity === 0 && newValue !== '' && selectedItem) {
      onUpdateItem(itemId, { transferQuantity: 0 });
    }
  };

  const handleQuantityBlur = (): void => {
    if (value === '' && selectedItem) {
      setValue(selectedItem.transferQuantity?.toString() || '0');
    }
  };

  const handleDetailChange = (field: keyof SelectedWarehouseStockItem, val: string): void => {
    if (!selectedItem) return;
    onUpdateItem(item.id, { [field]: val } as Partial<SelectedWarehouseStockItem>);
  };

  const quantity = parseFloat(value) || 0;
  const hasSelection = quantity > 0;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-2 transition-all sm:p-3',
        isOps && 'wms-ops-receipt-row',
        hasSelection && (isOps ? 'wms-ops-receipt-row--active' : 'border-primary/50 bg-primary/5'),
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className="font-semibold text-sm flex-1 min-w-0">{item.stockName}</h4>
            {hasSelection && (
              <Badge variant="default" className={cn('shrink-0 text-xs', isOps && 'wms-ops-order-badge wms-ops-order-badge--pending')}>
                {t('common.selected')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <Badge variant="outline" className={cn('w-fit font-mono text-xs', isOps && 'wms-ops-code-badge rounded-none')}>
              {item.stockCode}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <span>
              {t('warehouse.step2.unit')}:{' '}
              <strong className="text-foreground">{item.unit || '-'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
          <div className="flex flex-1 items-center gap-1.5 sm:flex-initial">
            {isOps ? (
              <OpsInput
                type="number"
                min="0"
                value={value}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleQuantityBlur}
                className="w-full text-right font-mono sm:w-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder={t('common.numericPlaceholder')}
              />
            ) : (
              <Input
                type="number"
                min="0"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleQuantityBlur}
                className="h-8 w-full text-right font-mono text-sm sm:w-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder={t('common.numericPlaceholder')}
              />
            )}
            <span className="whitespace-nowrap text-xs text-muted-foreground">{item.unit || ''}</span>
          </div>
          {isOps ? (
            <div className="flex shrink-0 items-center gap-1">
              <OpsActionButton
                type="button"
                variant="secondary"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={t('common:details')}
                title={t('common:details')}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </OpsActionButton>
              {selectedItem ? (
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  className="h-8 w-8 shrink-0 p-0 text-destructive"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={t('common:delete')}
                  title={t('common:delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </OpsActionButton>
              ) : null}
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={t('common:details')}
                title={t('common:details')}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {selectedItem ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={t('common:delete')}
                  title={t('common:delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3 mt-3 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor={`source-cell-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.sourceCellCode')}
              </Label>
              <ShelfLookupCombobox
                warehouseCode={sourceWarehouseCode}
                value={selectedItem?.sourceCellCode || ''}
                onValueChange={(cellValue) => handleDetailChange('sourceCellCode', cellValue)}
                placeholder={t('warehouse.details.sourceCellCodePlaceholder')}
                variant={isOps ? 'ops' : 'default'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`target-cell-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.targetCellCode')}
              </Label>
              <ShelfLookupCombobox
                warehouseCode={targetWarehouseCode}
                value={selectedItem?.targetCellCode || ''}
                onValueChange={(cellValue) => handleDetailChange('targetCellCode', cellValue)}
                placeholder={t('warehouse.details.targetCellCodePlaceholder')}
                variant={isOps ? 'ops' : 'default'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial-${item.id}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.serialNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`serial-${item.id}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`serial-${item.id}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial2-${item.id}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.serialNo2')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`serial2-${item.id}`}
                  value={selectedItem?.serialNo2 || ''}
                  onChange={(e) => handleDetailChange('serialNo2', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNo2Placeholder')}
                />
              ) : (
                <Input
                  id={`serial2-${item.id}`}
                  value={selectedItem?.serialNo2 || ''}
                  onChange={(e) => handleDetailChange('serialNo2', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNo2Placeholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${item.id}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.lotNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`lot-${item.id}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.lotNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`lot-${item.id}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.lotNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${item.id}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.batchNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`batch-${item.id}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.batchNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`batch-${item.id}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.batchNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`config-${item.id}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.configCode')}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PagedLookupDialog<YapKodLookup>
                    open={yapKodLookupOpen}
                    onOpenChange={setYapKodLookupOpen}
                    title={t('warehouse.details.configCode')}
                    description={item.stockName || item.stockCode || ''}
                    value={selectedItem?.configCode || ''}
                    placeholder={t('warehouse.details.configCodePlaceholder')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    variant={variant}
                    queryKey={['warehouse', 'yapkod', item.stockCode || item.id]}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getYapKodlarPaged(
                        { pageNumber, pageSize, search },
                        { stockId: selectedItem?.stockId, stockCode: item.stockCode },
                        { signal },
                      )
                    }
                    getKey={(yapKod) => yapKod.id.toString()}
                    getLabel={(yapKod) => `${yapKod.yapKod}${yapKod.yapAcik ? ` - ${yapKod.yapAcik}` : ''}`}
                    onSelect={(yapKod) =>
                      onUpdateItem(item.id, {
                        configCode: yapKod.yapKod,
                        yapKodId: yapKod.id,
                      })
                    }
                  />
                </div>
                {selectedItem?.configCode ? (
                  isOps ? (
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      className="h-9 shrink-0"
                      onClick={() => onUpdateItem(item.id, { configCode: '', yapKodId: undefined })}
                    >
                      {t('common.clear')}
                    </OpsActionButton>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => onUpdateItem(item.id, { configCode: '', yapKodId: undefined })}
                    >
                      {t('common.clear')}
                    </Button>
                  )
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedItem?.configCode || t('warehouse.details.configCodePlaceholder')}
              </p>
            </div>
          </div>
          {!selectedItem && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{t('warehouse.step2.enterQuantityToSelect')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
