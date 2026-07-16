import { type ReactElement, useEffect, useState, type FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { OpsActionButton, OpsFieldShell, OpsInput } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { OrderItem, SelectedOrderItem, SelectedStockItem, Warehouse } from '../../../types/goods-receipt';
import type { YapKodLookup } from '@/features/shared/api/lookup-types';

interface ReceivingItemRowProps {
    item: OrderItem;
    selectedItem?: SelectedOrderItem | SelectedStockItem;
    warehouses: Warehouse[];
    onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem | SelectedStockItem>) => void;
    onToggleItem: (item: OrderItem) => void;
    onRemoveItem: (itemId: string) => void;
    variant?: 'default' | 'ops';
}

export function ReceivingItemRow({
    item,
    selectedItem,
    warehouses,
    onUpdateItem,
    onToggleItem,
    onRemoveItem,
    variant = 'default',
}: ReceivingItemRowProps): ReactElement {
    const { t } = useTranslation(['goods-receipt', 'common']);
    const isOps = variant === 'ops';
    const [value, setValue] = useState(selectedItem?.receiptQuantity?.toString() || '');
    const [isExpanded, setIsExpanded] = useState(false);
    const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
    const [yapKodLookupOpen, setYapKodLookupOpen] = useState(false);

    useEffect(() => {
        setValue(selectedItem?.receiptQuantity?.toString() || '');
    }, [selectedItem?.receiptQuantity]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        if (newValue === '') {
            return;
        }

        const quantity = parseFloat(newValue);
        const itemId = item.id || '';

        if (!isNaN(quantity) && quantity > 0) {
            if (!selectedItem) {
                onToggleItem(item);
                setTimeout(() => onUpdateItem(itemId, { receiptQuantity: quantity }), 0);
            } else {
                onUpdateItem(itemId, { receiptQuantity: quantity });
            }
        } else if (quantity === 0 && selectedItem) {
            onUpdateItem(itemId, { receiptQuantity: 0 });
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
    const selectedWarehouseLabel =
        warehouses.find((warehouse) => warehouse.depoKodu === selectedItem?.warehouseId)?.depoIsmi
        && selectedItem?.warehouseId
            ? `${warehouses.find((warehouse) => warehouse.depoKodu === selectedItem?.warehouseId)?.depoIsmi} (${selectedItem.warehouseId})`
            : selectedItem?.warehouseId
                ? String(selectedItem.warehouseId)
                : '';

    const handleQuantityFocus = (event: FocusEvent<HTMLInputElement>): void => {
        event.currentTarget.select();
    };

    const handleQuantityBlur = (): void => {
        if (value === '') {
            setValue(selectedItem?.receiptQuantity?.toString() || '');
        }
    };

    return (
        <div
            className={cn(
                'relative border rounded-lg transition-all p-2 sm:p-3',
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
                        <h4 className="font-semibold text-sm flex-1 min-w-0">
                            {item.productName}
                        </h4>
                        {isOver && (
                            isOps ? (
                                <span className="wms-ops-over-badge">
                                    <AlertCircle className="size-3" aria-hidden />
                                    {t('common.over')}
                                </span>
                            ) : (
                                <Badge variant="destructive" className="text-xs shrink-0">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {t('common.over')}
                                </Badge>
                            )
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
                        {isOps ? (
                            <span className="wms-ops-code-badge w-fit">{item.productCode}</span>
                        ) : (
                            <Badge variant="outline" className="font-mono text-xs w-fit">
                                {item.productCode}
                            </Badge>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span>
                            {t('goodsReceipt.orderDetails.ordered')}:{' '}
                            <strong className="text-foreground">{itemQuantity} {item.unit || ''}</strong>
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:flex-initial">
                        <div className="w-full sm:w-32 shrink-0">
                            {isOps ? (
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
                                        triggerClassName={OPS_FIELD_CLASS}
                                        queryKey={['goods-receipt', 'warehouses', item.id || 'new']}
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
                                            const itemId = item.id || '';
                                            const warehouseCode = warehouse.depoKodu;
                                            if (!selectedItem) {
                                                onToggleItem(item);
                                                setTimeout(() => {
                                                    onUpdateItem(itemId, { warehouseId: warehouseCode });
                                                }, 0);
                                            } else {
                                                onUpdateItem(itemId, { warehouseId: warehouseCode });
                                            }
                                        }}
                                    />
                                </OpsFieldShell>
                            ) : (
                                <PagedLookupDialog<Warehouse>
                                    open={warehouseLookupOpen}
                                    onOpenChange={setWarehouseLookupOpen}
                                    title={t('goodsReceipt.step1.selectWarehouse')}
                                    description={item.productName || item.productCode || ''}
                                    value={selectedWarehouseLabel}
                                    placeholder={t('goodsReceipt.step1.selectWarehouse')}
                                    searchPlaceholder={t('common.search')}
                                    emptyText={t('common.notFound')}
                                    queryKey={['goods-receipt', 'warehouses', item.id || 'new']}
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
                                        const itemId = item.id || '';
                                        const warehouseCode = warehouse.depoKodu;
                                        if (!selectedItem) {
                                            onToggleItem(item);
                                            setTimeout(() => {
                                                onUpdateItem(itemId, { warehouseId: warehouseCode });
                                            }, 0);
                                        } else {
                                            onUpdateItem(itemId, { warehouseId: warehouseCode });
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            {isOps ? (
                                <OpsInput
                                    type="number"
                                    min="0"
                                    value={value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    onFocus={handleQuantityFocus}
                                    onBlur={handleQuantityBlur}
                                    className={cn(
                                        'h-8 w-full text-right font-mono text-sm sm:w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                                        isOver && 'border-destructive focus-visible:ring-destructive',
                                    )}
                                    placeholder={t('common.numericPlaceholder')}
                                />
                            ) : (
                                <Input
                                    type="number"
                                    min="0"
                                    value={value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    onFocus={handleQuantityFocus}
                                    onBlur={handleQuantityBlur}
                                    className={cn(
                                        'w-full sm:w-20 text-right font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                        isOver && 'border-destructive focus-visible:ring-destructive'
                                    )}
                                    placeholder={t('common.numericPlaceholder')}
                                />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit || ''}</span>
                        </div>
                    </div>
                    {selectedItem ? (
                        isOps ? (
                            <OpsActionButton
                                type="button"
                                variant="secondary"
                                className="wms-ops-receipt-row__remove-btn shrink-0"
                                aria-label={t('common.delete')}
                                onClick={() => onRemoveItem(item.id || '')}
                            >
                                <Trash2 className="size-3.5" aria-hidden />
                            </OpsActionButton>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0 px-2"
                                aria-label={t('common.delete')}
                                onClick={() => onRemoveItem(item.id || '')}
                            >
                                <Trash2 className="size-4" aria-hidden />
                            </Button>
                        )
                    ) : null}
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
                <div className={cn('mt-3 border-t pt-3', isOps && 'wms-ops-receipt-row__details')}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <div className={cn('space-y-2', isOps && 'wms-ops-form-item')}>
                            <Label
                                htmlFor={`serial-${item.id || ''}`}
                                className={cn(isOps ? 'wms-ops-notes-label' : 'text-sm font-medium')}
                            >
                                {t('goodsReceipt.details.serialNo')}
                            </Label>
                            {isOps ? (
                                <OpsInput
                                    id={`serial-${item.id || ''}`}
                                    value={selectedItem?.serialNo || ''}
                                    onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                                    className={OPS_FIELD_CLASS}
                                    placeholder={t('goodsReceipt.details.serialNoPlaceholder')}
                                />
                            ) : (
                                <Input
                                    id={`serial-${item.id || ''}`}
                                    value={selectedItem?.serialNo || ''}
                                    onChange={(e) => handleDetailChange('serialNo', e.target.value)}
                                    className="h-9 text-sm"
                                    placeholder={t('goodsReceipt.details.serialNoPlaceholder')}
                                />
                            )}
                        </div>
                        <div className={cn('space-y-2', isOps && 'wms-ops-form-item')}>
                            <Label
                                htmlFor={`lot-${item.id || ''}`}
                                className={cn(isOps ? 'wms-ops-notes-label' : 'text-sm font-medium')}
                            >
                                {t('goodsReceipt.details.lotNo')}
                            </Label>
                            {isOps ? (
                                <OpsInput
                                    id={`lot-${item.id || ''}`}
                                    value={selectedItem?.lotNo || ''}
                                    onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                                    className={OPS_FIELD_CLASS}
                                    placeholder={t('goodsReceipt.details.lotNoPlaceholder')}
                                />
                            ) : (
                                <Input
                                    id={`lot-${item.id || ''}`}
                                    value={selectedItem?.lotNo || ''}
                                    onChange={(e) => handleDetailChange('lotNo', e.target.value)}
                                    className="h-9 text-sm"
                                    placeholder={t('goodsReceipt.details.lotNoPlaceholder')}
                                />
                            )}
                        </div>
                        <div className={cn('space-y-2', isOps && 'wms-ops-form-item')}>
                            <Label
                                htmlFor={`batch-${item.id || ''}`}
                                className={cn(isOps ? 'wms-ops-notes-label' : 'text-sm font-medium')}
                            >
                                {t('goodsReceipt.details.batchNo')}
                            </Label>
                            {isOps ? (
                                <OpsInput
                                    id={`batch-${item.id || ''}`}
                                    value={selectedItem?.batchNo || ''}
                                    onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                                    className={OPS_FIELD_CLASS}
                                    placeholder={t('goodsReceipt.details.batchNoPlaceholder')}
                                />
                            ) : (
                                <Input
                                    id={`batch-${item.id || ''}`}
                                    value={selectedItem?.batchNo || ''}
                                    onChange={(e) => handleDetailChange('batchNo', e.target.value)}
                                    className="h-9 text-sm"
                                    placeholder={t('goodsReceipt.details.batchNoPlaceholder')}
                                />
                            )}
                        </div>
                        <div className={cn('space-y-2', isOps && 'wms-ops-form-item')}>
                            <Label
                                htmlFor={`config-${item.id || ''}`}
                                className={cn(isOps ? 'wms-ops-notes-label' : 'text-sm font-medium')}
                            >
                                {t('goodsReceipt.details.configCode')}
                            </Label>
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    {isOps ? (
                                        <OpsFieldShell className={yapKodLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                                            <PagedLookupDialog<YapKodLookup>
                                                variant="ops"
                                                open={yapKodLookupOpen}
                                                onOpenChange={setYapKodLookupOpen}
                                                title={t('goodsReceipt.details.configCode')}
                                                value={selectedItem?.configCode || ''}
                                                placeholder={t('goodsReceipt.details.configCodePlaceholder')}
                                                searchPlaceholder={t('common.search')}
                                                emptyText={t('common.notFound')}
                                                triggerClassName={OPS_FIELD_CLASS}
                                                queryKey={['goods-receipt', 'yapkod', item.productCode || item.stockCode || item.id || 'new']}
                                                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                                    lookupApi.getYapKodlarPaged(
                                                        { pageNumber, pageSize, search },
                                                        { stockId: selectedItem?.stockId, stockCode: item.productCode || item.stockCode },
                                                        { signal },
                                                    )
                                                }
                                                getKey={(yapKod) => yapKod.id.toString()}
                                                getLabel={(yapKod) => `${yapKod.yapKod}${yapKod.yapAcik ? ` - ${yapKod.yapAcik}` : ''}`}
                                                onSelect={(yapKod) => {
                                                    if (!selectedItem) {
                                                        return;
                                                    }

                                                    const itemId = item.id || '';
                                                    onUpdateItem(itemId, {
                                                        configCode: yapKod.yapKod,
                                                        yapKodId: yapKod.id,
                                                    });
                                                }}
                                            />
                                        </OpsFieldShell>
                                    ) : (
                                        <PagedLookupDialog<YapKodLookup>
                                            open={yapKodLookupOpen}
                                            onOpenChange={setYapKodLookupOpen}
                                            title={t('goodsReceipt.details.configCode')}
                                            description={item.productName || item.productCode || ''}
                                            value={selectedItem?.configCode || ''}
                                            placeholder={t('goodsReceipt.details.configCodePlaceholder')}
                                            searchPlaceholder={t('common.search')}
                                            emptyText={t('common.notFound')}
                                            queryKey={['goods-receipt', 'yapkod', item.productCode || item.stockCode || item.id || 'new']}
                                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                                                lookupApi.getYapKodlarPaged(
                                                    { pageNumber, pageSize, search },
                                                    { stockId: selectedItem?.stockId, stockCode: item.productCode || item.stockCode },
                                                    { signal },
                                                )
                                            }
                                            getKey={(yapKod) => yapKod.id.toString()}
                                            getLabel={(yapKod) => `${yapKod.yapKod}${yapKod.yapAcik ? ` - ${yapKod.yapAcik}` : ''}`}
                                            onSelect={(yapKod) => {
                                                if (!selectedItem) {
                                                    return;
                                                }

                                                const itemId = item.id || '';
                                                onUpdateItem(itemId, {
                                                    configCode: yapKod.yapKod,
                                                    yapKodId: yapKod.id,
                                                });
                                            }}
                                        />
                                    )}
                                </div>
                                {selectedItem?.configCode ? (
                                    isOps ? (
                                        <OpsActionButton
                                            type="button"
                                            variant="secondary"
                                            className="wms-ops-receipt-row__clear-btn shrink-0"
                                            onClick={() => {
                                                if (!selectedItem) {
                                                    return;
                                                }

                                                const itemId = item.id || '';
                                                onUpdateItem(itemId, {
                                                    configCode: '',
                                                    yapKodId: undefined,
                                                });
                                            }}
                                        >
                                            {t('common.clear')}
                                        </OpsActionButton>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 shrink-0"
                                            onClick={() => {
                                                if (!selectedItem) {
                                                    return;
                                                }

                                                const itemId = item.id || '';
                                                onUpdateItem(itemId, {
                                                    configCode: '',
                                                    yapKodId: undefined,
                                                });
                                            }}
                                        >
                                            {t('common.clear')}
                                        </Button>
                                    )
                                ) : null}
                            </div>
                            {!isOps ? (
                                <p className="text-xs text-muted-foreground">
                                    {selectedItem?.configCode || t('goodsReceipt.details.configCodePlaceholder')}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
