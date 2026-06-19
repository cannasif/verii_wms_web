import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Inbox, Loader2, Minus, Plus, Search, X } from 'lucide-react';
import { OpsActionButton, OpsInput, OpsPanelPagination } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { cn } from '@/lib/utils';
import type { Product } from '../../../types/goods-receipt';

const STOCK_PAGE_SIZE = 20;

interface StockSelectionPanelProps {
  selectedCountsByStockCode: Map<string, number>;
  onToggleItem: (item: Product) => void;
  onRemoveLastOfStock?: (stockCode: string) => void;
  onClearStockSelection?: (stockCode: string) => void;
  pageNumber: number;
  onPageChange: (pageNumber: number) => void;
  variant?: 'default' | 'ops';
}

export function StockSelectionPanel({
  selectedCountsByStockCode,
  onToggleItem,
  onRemoveLastOfStock,
  onClearStockSelection,
  pageNumber,
  onPageChange,
  variant = 'default',
}: StockSelectionPanelProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const isOps = variant === 'ops';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    onPageChange(1);
  }, [debouncedSearch, onPageChange]);

  const productsQuery = useQuery({
    queryKey: ['goods-receipt', 'products', debouncedSearch, pageNumber],
    queryFn: ({ signal }) =>
      lookupApi.getProductsPaged(
        {
          pageNumber,
          pageSize: STOCK_PAGE_SIZE,
          search: debouncedSearch.trim(),
        },
        { signal },
      ),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const products = productsQuery.data?.data ?? [];
  const totalPages = Math.max(1, productsQuery.data?.totalPages ?? 1);

  useEffect(() => {
    if (pageNumber > totalPages) {
      onPageChange(totalPages);
    }
  }, [onPageChange, pageNumber, totalPages]);

  const searchField = isOps ? (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] size-3.5 -translate-y-1/2" aria-hidden />
      <OpsInput
        placeholder={t('goodsReceipt.step2.searchStocks')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 pr-10 text-xs')}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" />
      </div>
    </div>
  ) : (
    <div className="relative flex items-center">
      <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        placeholder={t('goodsReceipt.step2.searchStocks')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="pl-8 pr-10"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" />
      </div>
    </div>
  );

  return (
    <div className={cn('flex h-full min-h-0 flex-col', isOps && 'wms-ops-stock-panel')}>
      <div className={cn('shrink-0 border-b p-4', isOps && 'wms-ops-stock-panel__search')}>
        {searchField}
      </div>

      <div className={cn('min-h-0 flex-1 space-y-1 overflow-y-auto p-2', isOps && 'wms-ops-stock-panel__list')}>
        {productsQuery.isLoading ? (
          isOps ? (
            <div className="wms-ops-panel-empty">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline size-4 animate-spin" />
              {t('common.loading')}
            </div>
          )
        ) : products.length === 0 ? (
          isOps ? (
            <div className="wms-ops-panel-empty">
              <Inbox className="size-6" aria-hidden />
              <p>{t('common.notFound')}</p>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('common.notFound')}</div>
          )
        ) : (
          products.map((product) => {
            const selectedCount = selectedCountsByStockCode.get(product.stokKodu) || 0;
            return (
              <div
                key={product.stokKodu}
                className={cn(
                  'border p-3 transition-colors',
                  isOps ? 'wms-ops-stock-card' : 'rounded-md',
                  !isOps && selectedCount > 0 && 'border-primary bg-primary/10',
                  !isOps && selectedCount === 0 && 'hover:bg-accent',
                  isOps && selectedCount > 0 && 'wms-ops-stock-card--selected',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', isOps && 'wms-ops-stock-badge')}
                      >
                        {product.stokKodu}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{product.olcuBr1}</span>
                    </div>
                    <p className="truncate text-sm font-medium">{product.stokAdi}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {selectedCount > 0 ? (
                      <>
                        <div className={cn('flex items-center gap-0.5', isOps && 'wms-ops-stock-qty')}>
                          {isOps ? (
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="wms-ops-stock-qty__btn"
                              aria-label={t('goodsReceipt.step2.decreaseQuantity')}
                              onClick={() => onRemoveLastOfStock?.(product.stokKodu)}
                            >
                              <Minus className="size-3" aria-hidden />
                            </OpsActionButton>
                          ) : (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-7"
                              aria-label={t('goodsReceipt.step2.decreaseQuantity')}
                              onClick={() => onRemoveLastOfStock?.(product.stokKodu)}
                            >
                              <Minus className="size-3.5" aria-hidden />
                            </Button>
                          )}
                          <span className={cn('min-w-[1.5rem] text-center text-xs font-semibold tabular-nums', isOps && 'wms-ops-stock-qty__value')}>
                            {selectedCount}
                          </span>
                          {isOps ? (
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="wms-ops-stock-qty__btn"
                              aria-label={t('goodsReceipt.step2.increaseQuantity')}
                              onClick={() => onToggleItem(product)}
                            >
                              <Plus className="size-3" aria-hidden />
                            </OpsActionButton>
                          ) : (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-7"
                              aria-label={t('goodsReceipt.step2.increaseQuantity')}
                              onClick={() => onToggleItem(product)}
                            >
                              <Plus className="size-3.5" aria-hidden />
                            </Button>
                          )}
                        </div>
                        {isOps ? (
                          <OpsActionButton
                            type="button"
                            variant="secondary"
                            className="wms-ops-stock-clear-btn"
                            aria-label={t('goodsReceipt.step2.removeSelection')}
                            title={t('goodsReceipt.step2.removeSelection')}
                            onClick={() => onClearStockSelection?.(product.stokKodu)}
                          >
                            <X className="size-3.5" aria-hidden />
                          </OpsActionButton>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            aria-label={t('goodsReceipt.step2.removeSelection')}
                            title={t('goodsReceipt.step2.removeSelection')}
                            onClick={() => onClearStockSelection?.(product.stokKodu)}
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        )}
                      </>
                    ) : isOps ? (
                      <OpsActionButton
                        type="button"
                        variant="secondary"
                        className="wms-ops-stock-add-btn"
                        onClick={() => onToggleItem(product)}
                      >
                        {t('common.add')}
                      </OpsActionButton>
                    ) : (
                      <Button type="button" size="sm" onClick={() => onToggleItem(product)}>
                        {t('common.add')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <OpsPanelPagination
        variant={variant}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPrevious={() => onPageChange(Math.max(1, pageNumber - 1))}
        onNext={() => onPageChange(Math.min(totalPages, pageNumber + 1))}
        disabled={productsQuery.isLoading && !productsQuery.data}
        className={cn('shrink-0 border-t', isOps && 'wms-ops-stock-panel__pagination')}
      />
    </div>
  );
}
