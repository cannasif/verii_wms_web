import { type ReactElement, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { SelectedTransferStockItem } from '../../../types/transfer';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';

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
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const itemId = `stock-${product.stokKodu}`;
  const quantity = selectedItem?.transferQuantity || 0;

  useEffect(() => {
    if (!selectedItem) {
      setIsExpanded(false);
    }
  }, [selectedItem]);

  const handleQuantityChange = (newValue: string): void => {
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
    } else if (newValue === '' || qty === 0) {
      if (selectedItem) {
        onRemoveItem(itemId);
        setIsExpanded(false);
      }
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
              value={quantity || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className={cn(
                'w-full sm:w-20 text-right font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              )}
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {product.olcuBr1}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedItem) {
                setIsExpanded(!isExpanded);
              }
            }}
            disabled={!selectedItem}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {isExpanded && selectedItem && (
        <div className="pt-3 mt-3 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor={`serial-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.serialNo', 'Seri No')}
              </Label>
              <Input
                id={`serial-${itemId}`}
                value={selectedItem.serialNo || ''}
                onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.serialNoPlaceholder', 'Seri No giriniz')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`serial2-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.serialNo2', 'Seri No 2')}
              </Label>
              <Input
                id={`serial2-${itemId}`}
                value={selectedItem.serialNo2 || ''}
                onChange={(e) => handleDetailChange('serialNo2', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.serialNo2Placeholder', 'Seri No 2 giriniz')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lot-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.lotNo', 'Parti No')}
              </Label>
              <Input
                id={`lot-${itemId}`}
                value={selectedItem.lotNo || ''}
                onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.lotNoPlaceholder', 'Parti No giriniz')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`batch-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.batchNo', 'Batch No')}
              </Label>
              <Input
                id={`batch-${itemId}`}
                value={selectedItem.batchNo || ''}
                onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.batchNoPlaceholder', 'Batch No giriniz')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`config-${itemId}`} className="text-sm font-medium">
                {t('transfer.details.configCode', 'Yapılandırma Kodu')}
              </Label>
              <Input
                id={`config-${itemId}`}
                value={selectedItem.configCode || ''}
                onChange={(e) => handleDetailChange('configCode', e.target.value)}
                className="h-9 text-sm"
                placeholder={t('transfer.details.configCodePlaceholder', 'Yapılandırma Kodu giriniz')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

