import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { OrderItem, SelectedOrderItem, SelectedStockItem, Warehouse } from '../../../types/goods-receipt';
import { SearchableSelect } from './SearchableSelect';

interface ReceivingItemRowProps {
    item: OrderItem;
    selectedItem?: SelectedOrderItem | SelectedStockItem;
    warehouses: Warehouse[];
    onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem | SelectedStockItem>) => void;
    onToggleItem: (item: OrderItem) => void;
    onRemoveItem: (itemId: string) => void;
}

export function ReceivingItemRow({
    item,
    selectedItem,
    warehouses,
    onUpdateItem,
    onToggleItem,
    onRemoveItem,
}: ReceivingItemRowProps): ReactElement {
    const { t } = useTranslation();
    const [value, setValue] = useState(selectedItem?.receiptQuantity?.toString() || '');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setValue(selectedItem?.receiptQuantity?.toString() || '');
    }, [selectedItem?.receiptQuantity]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        const quantity = parseFloat(newValue);
        const itemId = item.id || '';

        if (!isNaN(quantity) && quantity > 0) {
            if (!selectedItem) {
                onToggleItem(item);
                setTimeout(() => onUpdateItem(itemId, { receiptQuantity: quantity }), 0);
            } else {
                onUpdateItem(itemId, { receiptQuantity: quantity });
            }
        } else if (newValue === '' || quantity === 0) {
            if (selectedItem) {
                onRemoveItem(itemId);
            }
        }
    };

    const handleDetailChange = (field: keyof (SelectedOrderItem | SelectedStockItem), val: string) => {
        if (!selectedItem) return;
        const itemId = item.id || '';
        onUpdateItem(itemId, { [field]: val } as Partial<SelectedOrderItem | SelectedStockItem>);
    };

    const quantity = parseFloat(value) || 0;
    const itemQuantity = item.quantity ?? 0;
    const progress = Math.min((quantity / itemQuantity) * 100, 100);
    const isOver = quantity > itemQuantity;

    return (
        <div
            className={cn(
                'relative border rounded-lg transition-all',
                quantity > 0 && 'border-primary/50 bg-primary/5',
                isOver && 'border-destructive',
                'p-2 sm:p-3'
            )}
        >
            <div
                className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-500 rounded-b-lg"
                style={{ width: `${progress}%`, opacity: quantity > 0 ? 1 : 0 }}
            />
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm flex-1 min-w-0">
                            {item.productName}
                        </h4>
                        {isOver && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {t('common.over', 'Fazla')}
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="font-mono text-xs w-fit">
                            {item.productCode}
                        </Badge>
                        <span className="hidden sm:inline">•</span>
                        <span>
                            {t('goodsReceipt.orderDetails.ordered', 'Sipariş')}:{' '}
                            <strong className="text-foreground">{itemQuantity} {item.unit || ''}</strong>
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:flex-initial">
                        <div className="w-full sm:w-32 shrink-0">
                            <SearchableSelect<Warehouse>
                                value={selectedItem?.warehouseId?.toString() || ''}
                                onValueChange={(val) => {
                                    const itemId = item.id || '';
                                    if (!selectedItem) {
                                        onToggleItem(item);
                                        setTimeout(() => {
                                            onUpdateItem(itemId, { warehouseId: val ? Number(val) : undefined });
                                        }, 0);
                                    } else {
                                        onUpdateItem(itemId, { warehouseId: val ? Number(val) : undefined });
                                    }
                                }}
                                options={warehouses}
                                getOptionValue={(opt) => opt.depoKodu.toString()}
                                getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                                placeholder={t('goodsReceipt.step1.selectWarehouse', 'Depo seçiniz')}
                                searchPlaceholder={t('common.search', 'Ara...')}
                                emptyText={t('common.notFound', 'Bulunamadı')}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <Input
                                type="number"
                                min="0"
                                value={value}
                                onChange={(e) => handleChange(e.target.value)}
                                className={cn(
                                    'w-full sm:w-20 text-right font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                    isOver && 'border-destructive focus-visible:ring-destructive'
                                )}
                                placeholder="0"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit || ''}</span>
                        </div>
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
                            <Label htmlFor={`serial-${item.id || ''}`} className="text-sm font-medium">
                                {t('goodsReceipt.details.serialNo', 'Seri No')}
                            </Label>
                            <Input
                                id={`serial-${item.id || ''}`}
                                value={selectedItem?.serialNo || ''}
                                onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                                className="h-9 text-sm"
                                placeholder={t('goodsReceipt.details.serialNoPlaceholder', 'Seri No giriniz')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`lot-${item.id || ''}`} className="text-sm font-medium">
                                {t('goodsReceipt.details.lotNo', 'Parti No')}
                            </Label>
                            <Input
                                id={`lot-${item.id || ''}`}
                                value={selectedItem?.lotNo || ''}
                                onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                                className="h-9 text-sm"
                                placeholder={t('goodsReceipt.details.lotNoPlaceholder', 'Parti No giriniz')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`batch-${item.id || ''}`} className="text-sm font-medium">
                                {t('goodsReceipt.details.batchNo', 'Batch No')}
                            </Label>
                            <Input
                                id={`batch-${item.id || ''}`}
                                value={selectedItem?.batchNo || ''}
                                onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                                className="h-9 text-sm"
                                placeholder={t('goodsReceipt.details.batchNoPlaceholder', 'Batch No giriniz')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`config-${item.id || ''}`} className="text-sm font-medium">
                                {t('goodsReceipt.details.configCode', 'Yapılandırma Kodu')}
                            </Label>
                            <Input
                                id={`config-${item.id || ''}`}
                                value={selectedItem?.configCode || ''}
                                onChange={(e) => handleDetailChange('configCode', e.target.value)}
                                className="h-9 text-sm"
                                placeholder={t('goodsReceipt.details.configCodePlaceholder', 'Yapılandırma Kodu giriniz')}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
