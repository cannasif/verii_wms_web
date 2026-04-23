import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { lookupApi } from '@/services/lookup-api';
import type { YapKodLookup } from '@/services/lookup-types';
import type { SelectedWarehouseStockItem, WarehouseStockItem } from '../../../types/warehouse';

interface WarehouseBulkItemRowProps {
  item: WarehouseStockItem;
  selectedItem?: SelectedWarehouseStockItem;
  sourceWarehouseCode?: string;
  targetWarehouseCode?: string;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseStockItem>) => void;
  onToggleItem: (item: WarehouseStockItem) => void;
  onRemoveItem: (itemId: string) => void;
}

export function WarehouseBulkItemRow({
  item,
  selectedItem,
  sourceWarehouseCode,
  targetWarehouseCode,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
}: WarehouseBulkItemRowProps): ReactElement {
  const { t } = useTranslation();
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
    } else if (newValue === '' || quantity === 0) {
      if (selectedItem) {
        onRemoveItem(itemId);
      }
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
        'relative border rounded-lg transition-all p-2 sm:p-3',
        hasSelection && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className="font-semibold text-sm flex-1 min-w-0">{item.stockName}</h4>
            {hasSelection && (
              <Badge variant="default" className="text-xs shrink-0">
                {t('common.selected')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs w-fit">
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
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Input
              type="number"
              min="0"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full sm:w-24 text-right font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder={t('common.numericPlaceholder')}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit || ''}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
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
                onValueChange={(value) => handleDetailChange('sourceCellCode', value)}
                placeholder={t('warehouse.details.sourceCellCodePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`target-cell-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.targetCellCode')}
              </Label>
              <ShelfLookupCombobox
                warehouseCode={targetWarehouseCode}
                value={selectedItem?.targetCellCode || ''}
                onValueChange={(value) => handleDetailChange('targetCellCode', value)}
                placeholder={t('warehouse.details.targetCellCodePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.serialNo')}
              </Label>
              <Input
                id={`serial-${item.id}`}
                value={selectedItem?.serialNo || ''}
                onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('warehouse.details.serialNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial2-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.serialNo2')}
              </Label>
              <Input
                id={`serial2-${item.id}`}
                value={selectedItem?.serialNo2 || ''}
                onChange={(e) => handleDetailChange('serialNo2', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('warehouse.details.serialNo2Placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.lotNo')}
              </Label>
              <Input
                id={`lot-${item.id}`}
                value={selectedItem?.lotNo || ''}
                onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('warehouse.details.lotNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${item.id}`} className="text-sm font-medium">
                {t('warehouse.details.batchNo')}
              </Label>
              <Input
                id={`batch-${item.id}`}
                value={selectedItem?.batchNo || ''}
                onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('warehouse.details.batchNoPlaceholder')}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`config-${item.id}`} className="text-sm font-medium">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => onUpdateItem(item.id, { configCode: '', yapKodId: undefined })}
                  >
                    {t('common.clear')}
                  </Button>
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
