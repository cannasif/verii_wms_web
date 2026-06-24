import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OpsActionButton, OpsInput } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { WarehouseOrderItem, SelectedWarehouseOrderItem } from '../../../types/warehouse';

interface WarehouseItemRowProps {
  item: WarehouseOrderItem;
  selectedItem?: SelectedWarehouseOrderItem;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseOrderItem>) => void;
  onToggleItem: (item: WarehouseOrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function WarehouseItemRow({
  item,
  selectedItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: WarehouseItemRowProps): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const isOps = variant === 'ops';
  const [value, setValue] = useState(selectedItem?.transferQuantity?.toString() || '');
  const [isExpanded, setIsExpanded] = useState(false);

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
    field: keyof SelectedWarehouseOrderItem,
    val: string | number
  ): void => {
    if (!selectedItem) return;
    const itemId = item.id || '';
    onUpdateItem(itemId, { [field]: val } as Partial<SelectedWarehouseOrderItem>);
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
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className="font-semibold text-sm flex-1 min-w-0">{item.stockName}</h4>
            {isOver && (
              <Badge variant="destructive" className="text-xs shrink-0">
                <AlertCircle className="w-3 h-3 mr-1" />
                {t('common.over')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className={cn('w-fit font-mono text-xs', isOps && 'wms-ops-code-badge rounded-none')}>
              {item.stockCode}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <span>
              {t('warehouse.step2.ordered')}:{' '}
              <strong className="text-foreground">{item.orderedQty}</strong>
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
                {t('warehouse.details.serialNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`serial-${item.id || ''}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`serial-${item.id || ''}`}
                  value={selectedItem?.serialNo || ''}
                  onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.serialNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.lotNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`lot-${item.id || ''}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.lotNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`lot-${item.id || ''}`}
                  value={selectedItem?.lotNo || ''}
                  onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.lotNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.batchNo')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`batch-${item.id || ''}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.batchNoPlaceholder')}
                />
              ) : (
                <Input
                  id={`batch-${item.id || ''}`}
                  value={selectedItem?.batchNo || ''}
                  onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.batchNoPlaceholder')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`config-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('warehouse.details.configCode')}
              </Label>
              {isOps ? (
                <OpsInput
                  id={`config-${item.id || ''}`}
                  value={selectedItem?.configCode || ''}
                  onChange={(e) => handleDetailChange('configCode', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.configCodePlaceholder')}
                />
              ) : (
                <Input
                  id={`config-${item.id || ''}`}
                  value={selectedItem?.configCode || ''}
                  onChange={(e) => handleDetailChange('configCode', e.target.value)}
                  className="h-9 text-sm"
                  placeholder={t('warehouse.details.configCodePlaceholder')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
