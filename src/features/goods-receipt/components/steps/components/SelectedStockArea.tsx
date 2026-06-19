import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { OpsInput, OpsPanelPagination } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { cn } from '@/lib/utils';
import { ReceivingItemRow } from './ReceivingItemRow';
import type {
  OrderItem,
  SelectedStockItem,
  Warehouse,
} from '../../../types/goods-receipt';

const SELECTED_PAGE_SIZE = 20;

interface SelectedStockAreaProps {
  customerCode: string;
  selectedItems: SelectedStockItem[];
  stockOrderQuantities: Map<string, number>;
  warehouses: Warehouse[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
  pageNumber: number;
  onPageChange: (pageNumber: number) => void;
  variant?: 'default' | 'ops';
}

export function SelectedStockArea({
  customerCode,
  selectedItems,
  stockOrderQuantities,
  warehouses,
  onUpdateItem,
  onRemoveItem,
  pageNumber,
  onPageChange,
  variant = 'default',
}: SelectedStockAreaProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const isOps = variant === 'ops';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedItems;
    }

    const query = searchQuery.toLowerCase();
    return selectedItems.filter(
      (item) =>
        item.stockCode.toLowerCase().includes(query) ||
        item.stockName.toLowerCase().includes(query),
    );
  }, [searchQuery, selectedItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / SELECTED_PAGE_SIZE));

  useEffect(() => {
    onPageChange(1);
  }, [onPageChange, searchQuery]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      onPageChange(totalPages);
    }
  }, [onPageChange, pageNumber, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (pageNumber - 1) * SELECTED_PAGE_SIZE;
    return filteredItems.slice(start, start + SELECTED_PAGE_SIZE);
  }, [filteredItems, pageNumber]);

  return (
    <div className={cn('flex h-full min-h-0 flex-col', isOps && 'wms-ops-receiving-area')}>
      <div className={cn('shrink-0 space-y-2 border-b px-2 pb-2', isOps && 'wms-ops-receiving-area__header')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className={cn('text-sm font-semibold', isOps && 'wms-ops-receiving-area__title')}>
              {t('goodsReceipt.step2.selectedItems')}
            </h3>
            <p className={cn('text-xs text-muted-foreground', isOps && 'wms-ops-receiving-area__meta')}>
              {t('goodsReceipt.step2.itemsCount', { count: selectedItems.length })}
            </p>
          </div>
        </div>
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 z-[1] size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          {isOps ? (
            <OpsInput
              placeholder={t('goodsReceipt.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 pr-9 text-xs')}
            />
          ) : (
            <Input
              placeholder={t('goodsReceipt.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-7 pl-7 pr-9 text-xs"
            />
          )}
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <VoiceSearchButton
              onResult={setSearchQuery}
              size="sm"
              variant="ghost"
              className="h-5 w-5"
            />
          </div>
        </div>
      </div>

      <div className={cn('min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2', isOps && 'wms-ops-receiving-area__list')}>
        {selectedItems.length === 0 ? (
          <div className={cn('py-12 text-center', isOps && 'wms-ops-panel-empty wms-ops-panel-empty--inline')}>
            <p className={cn('text-sm text-muted-foreground', isOps && 'wms-ops-panel-empty__hint')}>
              {t('goodsReceipt.step2.noSelectedItems')}
            </p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className={cn('py-8 text-center', isOps && 'wms-ops-panel-empty wms-ops-panel-empty--inline')}>
            <p className={cn('text-sm text-muted-foreground', isOps && 'wms-ops-panel-empty__hint')}>
              {t('common.noResults')}
            </p>
          </div>
        ) : (
          paginatedItems.map((item) => {
            const orderQuantity = stockOrderQuantities.get(item.stockCode) || 0;
            const orderItem: OrderItem = {
              id: item.id,
              mode: 'STOCK',
              siparisNo: '',
              orderID: 0,
              stockCode: item.stockCode,
              stockName: item.stockName,
              customerCode,
              customerName: '',
              branchCode: 0,
              targetWh: 0,
              projectCode: '',
              orderDate: new Date().toISOString(),
              orderedQty: orderQuantity,
              deliveredQty: 0,
              remainingHamax: orderQuantity,
              plannedQtyAllocated: 0,
              remainingForImport: orderQuantity,
              productCode: item.stockCode,
              productName: item.stockName,
              quantity: orderQuantity,
              unit: item.unit,
              unitPrice: 0,
              totalPrice: 0,
            };

            return (
              <ReceivingItemRow
                key={item.id}
                item={orderItem}
                selectedItem={item}
                warehouses={warehouses}
                onUpdateItem={(_, updates) => onUpdateItem(item.id, updates)}
                onToggleItem={() => {}}
                onRemoveItem={() => onRemoveItem(item.id)}
                variant={variant}
              />
            );
          })
        )}
      </div>

      {filteredItems.length > 0 ? (
        <OpsPanelPagination
          variant={variant}
          pageNumber={pageNumber}
          totalPages={totalPages}
        onPrevious={() => onPageChange(Math.max(1, pageNumber - 1))}
        onNext={() => onPageChange(Math.min(totalPages, pageNumber + 1))}
          className={cn('shrink-0 border-t', isOps && 'wms-ops-stock-panel__pagination')}
        />
      ) : null}
    </div>
  );
}
