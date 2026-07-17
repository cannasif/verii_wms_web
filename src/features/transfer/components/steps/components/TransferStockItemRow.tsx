import { type ReactElement, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { SelectedTransferStockItem } from '../../../types/transfer';
import type { Product } from '@/features/shared';
import type { YapKodLookup } from '@/features/shared/api/lookup-types';

interface TransferStockItemRowProps {
  product: Product;
  selectedItem?: SelectedTransferStockItem;
  onUpdateItem: (itemId: string, updates: Partial<SelectedTransferStockItem>) => void;
  onToggleItem: (item: Product) => void;
  onRemoveItem: (itemId: string) => void;
}

export function TransferStockItemRow({
  product,
  selectedItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
}: TransferStockItemRowProps): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [yapKodLookupOpen, setYapKodLookupOpen] = useState(false);
  const itemId = selectedItem?.id || `stock-${product.stokKodu}`;
  const quantity = selectedItem?.transferQuantity || 0;
  const [quantityInput, setQuantityInput] = useState(selectedItem ? String(selectedItem.transferQuantity ?? 0) : '');

  useEffect(() => {
    if (!selectedItem) {
      setIsExpanded(false);
    }
    setQuantityInput(selectedItem ? String(selectedItem.transferQuantity ?? 0) : '');
  }, [selectedItem, selectedItem?.transferQuantity]);

  const handleQuantityChange = (newValue: string): void => {
    setQuantityInput(newValue);
    const qty = parseFloat(newValue);
    if (!isNaN(qty) && qty > 0) {
      if (!selectedItem) {
        onToggleItem(product);
        setTimeout(() => {
          onUpdateItem(itemId, { transferQuantity: qty });
          setIsExpanded(true);
        }, 0);
      } else {
        onUpdateItem(itemId, { transferQuantity: qty });
      }
    } else if (qty === 0 && newValue !== '' && selectedItem) {
      onUpdateItem(itemId, { transferQuantity: 0 });
    }
  };

  const handleQuantityBlur = (): void => {
    if (quantityInput === '' && selectedItem) {
      setQuantityInput(String(selectedItem.transferQuantity ?? 0));
    }
  };

  const handleDetailChange = (
    field: keyof SelectedTransferStockItem,
    val: string | number
  ): void => {
    if (!selectedItem) return;
    onUpdateItem(itemId, { [field]: val } as Partial<SelectedTransferStockItem>);
  };

  return (
    <div
      className={cn(
        'relative border rounded-lg transition-all p-2 sm:p-3',
        quantity > 0 && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className="font-semibold text-sm flex-1 min-w-0">{product.stokAdi}</h4>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs w-fit">
              {product.stokKodu}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <span>
              {t('transfer.step2.unit')}: <strong className="text-foreground">{product.olcuBr1}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Input
              type="number"
              min="0"
              value={quantityInput}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={handleQuantityBlur}
              className={cn(
                'w-full sm:w-20 text-right font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              )}
              placeholder={t('common.numericPlaceholder')}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {product.olcuBr1}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedItem) {
                  setIsExpanded(!isExpanded);
                }
              }}
              disabled={!selectedItem}
              aria-label={t('common.details')}
              title={t('common.details')}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {selectedItem ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                onClick={() => onRemoveItem(itemId)}
                aria-label={t('common.delete')}
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {isExpanded && selectedItem && (
        <div className="pt-3 mt-3 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor={`serial-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.serialNo')}
              </Label>
              <Input
                id={`serial-${itemId}`}
                value={selectedItem.serialNo || ''}
                onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.serialNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial2-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.serialNo2')}
              </Label>
              <Input
                id={`serial2-${itemId}`}
                value={selectedItem.serialNo2 || ''}
                onChange={(e) => handleDetailChange('serialNo2', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.serialNo2Placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.lotNo')}
              </Label>
              <Input
                id={`lot-${itemId}`}
                value={selectedItem.lotNo || ''}
                onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.lotNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.batchNo')}
              </Label>
              <Input
                id={`batch-${itemId}`}
                value={selectedItem.batchNo || ''}
                onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.batchNoPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`config-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.configCode')}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PagedLookupDialog<YapKodLookup>
                    open={yapKodLookupOpen}
                    onOpenChange={setYapKodLookupOpen}
                    title={t('transfer.details.configCode')}
                    description={product.stokAdi || product.stokKodu || ''}
                    value={selectedItem.configCode || ''}
                    placeholder={t('transfer.details.configCodePlaceholder')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.notFound')}
                    queryKey={['transfer', 'stock-yapkod', product.stokKodu || itemId]}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getYapKodlarPaged(
                        { pageNumber, pageSize, search },
                        { stockId: selectedItem.stockId, stockCode: product.stokKodu },
                        { signal },
                      )
                    }
                    getKey={(yapKod) => yapKod.id.toString()}
                    getLabel={(yapKod) => `${yapKod.yapKod}${yapKod.yapAcik ? ` - ${yapKod.yapAcik}` : ''}`}
                    onSelect={(yapKod) => onUpdateItem(itemId, { configCode: yapKod.yapKod, yapKodId: yapKod.id })}
                  />
                </div>
                {selectedItem.configCode ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => onUpdateItem(itemId, { configCode: '', yapKodId: undefined })}
                  >
                    {t('common.clear')}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedItem.configCode || t('transfer.details.configCodePlaceholder')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
