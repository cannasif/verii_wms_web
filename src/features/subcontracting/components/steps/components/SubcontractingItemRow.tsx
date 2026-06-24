import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { SubcontractingOrderItem, SelectedSubcontractingOrderItem } from '../../../types/subcontracting';
import type { YapKodLookup } from '@/features/shared/api/lookup-types';

interface SubcontractingItemRowProps {
  item: SubcontractingOrderItem;
  selectedItem?: SelectedSubcontractingOrderItem;
  onUpdateItem: (itemId: string, updates: Partial<SelectedSubcontractingOrderItem>) => void;
  onToggleItem: (item: SubcontractingOrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function SubcontractingItemRow({
  item,
  selectedItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: SubcontractingItemRowProps): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
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
    field: keyof SelectedSubcontractingOrderItem,
    val: string | number
  ): void => {
    if (!selectedItem) return;
    const itemId = item.id || '';
    onUpdateItem(itemId, { [field]: val } as Partial<SelectedSubcontractingOrderItem>);
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
          'absolute bottom-0 left-0 h-0.5 transition-all duration-500 rounded-b-lg',
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
              {t('subcontracting.step2.ordered')}:{' '}
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
                onChange={(event) => handleChange(event.target.value)}
                className={cn(
                  'h-8 w-full text-right font-mono text-sm [appearance:textfield] sm:w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
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
        <div className="pt-3 mt-3 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor={`serial-${item.id || ''}`} className={cn('text-sm font-medium', isOps && 'wms-ops-detail-field__label')}>
                {t('subcontracting.details.serialNo')}
              </Label>
              <Input
                id={`serial-${item.id || ''}`}
                value={selectedItem?.serialNo || ''}
                onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('subcontracting.details.serialNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${item.id || ''}`} className="text-sm font-medium">
                {t('subcontracting.details.lotNo')}
              </Label>
              <Input
                id={`lot-${item.id || ''}`}
                value={selectedItem?.lotNo || ''}
                onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('subcontracting.details.lotNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${item.id || ''}`} className="text-sm font-medium">
                {t('subcontracting.details.batchNo')}
              </Label>
              <Input
                id={`batch-${item.id || ''}`}
                value={selectedItem?.batchNo || ''}
                onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('subcontracting.details.batchNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`config-${item.id || ''}`} className="text-sm font-medium">
                {t('subcontracting.details.configCode')}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PagedLookupDialog<YapKodLookup>
                    open={yapKodLookupOpen}
                    onOpenChange={setYapKodLookupOpen}
                    title={t('subcontracting.details.configCode')}
                    description={item.stockName || item.stockCode || ''}
                    value={selectedItem?.configCode || ''}
                    placeholder={t('subcontracting.details.configCodePlaceholder')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    variant={variant}
                    queryKey={['subcontracting', 'yapkod', item.stockCode || item.id || 'new']}
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
                      onUpdateItem(item.id || '', {
                        configCode: yapKod.yapKod,
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
                      onClick={() => onUpdateItem(item.id || '', { configCode: '' })}
                    >
                      {t('common.clear')}
                    </OpsActionButton>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => onUpdateItem(item.id || '', { configCode: '' })}
                    >
                      {t('common.clear')}
                    </Button>
                  )
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedItem?.configCode || t('subcontracting.details.configCodePlaceholder')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
