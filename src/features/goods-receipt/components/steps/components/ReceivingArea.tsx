import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PackageOpen, Search, Loader2 } from 'lucide-react';
import { OpsInput } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { goodsReceiptApi } from '../../../api/goods-receipt-api';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { ReceivingItemRow } from './ReceivingItemRow';
import type { SelectedOrderItem, OrderItem } from '../../../types/goods-receipt';

interface ReceivingAreaProps {
  customerCode: string | null;
  siparisNo: string | null;
  selectedItems: SelectedOrderItem[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem>) => void;
  onToggleItem: (item: OrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function ReceivingArea({
  customerCode,
  siparisNo,
  selectedItems,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: ReceivingAreaProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const isOps = variant === 'ops';

  const { data: orderItems, isLoading } = useQuery({
    queryKey: ['orderItems', customerCode, siparisNo],
    queryFn: ({ signal }) => goodsReceiptApi.getOrderItems(customerCode!, siparisNo!, { signal }),
    enabled: !!customerCode && !!siparisNo,
  });

  const { data: warehouses = [] } = useWarehouses();

  const mappedOrderItems = useMemo((): OrderItem[] => {
    if (!orderItems) return [];
    return orderItems.map((item, index) => ({
      ...item,
      id: item.id || `${item.orderID}-${item.stockCode}-${index}`,
      productCode: item.stockCode,
      productName: item.stockName,
      quantity: item.remainingForImport,
      unit: item.unit,
      unitPrice: 0,
      totalPrice: 0,
    }));
  }, [orderItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mappedOrderItems;
    const query = searchQuery.toLowerCase();
    return mappedOrderItems.filter((item) => {
      const codeMatch = item.productCode?.toLowerCase().includes(query);
      const nameMatch = item.productName?.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [mappedOrderItems, searchQuery]);


  if (!siparisNo) {
    if (isOps) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-6">
          <div className="wms-ops-panel-empty wms-ops-panel-empty--detail">
            <PackageOpen className="size-10" aria-hidden />
            <p className="wms-ops-panel-empty__title">{t('goodsReceipt.step2.noOrderSelected')}</p>
            <p className="wms-ops-panel-empty__hint">{t('goodsReceipt.step2.selectOrderPrompt')}</p>
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <PackageOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <CardTitle>{t('goodsReceipt.step2.noOrderSelected')}</CardTitle>
              <CardDescription>
                {t('goodsReceipt.step2.selectOrderPrompt')}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    if (isOps) {
      return (
        <div className="flex h-full min-h-[280px] items-center justify-center p-6">
          <div className="wms-ops-panel-empty">
            <Loader2 className="size-8 animate-spin" aria-hidden />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!mappedOrderItems || mappedOrderItems.length === 0) {
    if (isOps) {
      return (
        <div className="flex h-full min-h-[280px] items-center justify-center p-6">
          <div className="wms-ops-panel-empty">
            <PackageOpen className="size-8" aria-hidden />
            <p>{t('goodsReceipt.orderItems.itemNotFound')}</p>
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <PackageOpen className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {t('goodsReceipt.orderItems.itemNotFound')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = mappedOrderItems.length;
  const startedItems = mappedOrderItems.filter(item =>
    selectedItems.some(si => si.id === item.id && si.receiptQuantity > 0)
  ).length;

  return (
    <div className={cn('flex h-full flex-col', isOps && 'wms-ops-receiving-area')}>
      <div className={cn('shrink-0 space-y-2 border-b px-2 pb-2', isOps && 'wms-ops-receiving-area__header')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className={cn('text-sm font-semibold', isOps && 'wms-ops-receiving-area__title')}>
              {t('goodsReceipt.step2.orderContent')}
            </h3>
            <p className={cn('text-xs text-muted-foreground', isOps && 'wms-ops-receiving-area__meta')}>
              {t('goodsReceipt.step2.itemsCount', { count: totalItems })}
            </p>
          </div>
          <div className="text-right">
            <p className={cn('text-xs text-muted-foreground', isOps && 'wms-ops-receiving-area__meta')}>
              {t('goodsReceipt.step2.started')}
            </p>
            <p className={cn('text-sm font-semibold', isOps && 'wms-ops-receiving-area__stat')}>
              {startedItems}/{totalItems}
            </p>
          </div>
        </div>
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          {isOps ? (
            <OpsInput
              placeholder={t('goodsReceipt.step2.searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 pr-9 text-xs')}
            />
          ) : (
            <Input
              placeholder={t('goodsReceipt.step2.searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 pr-9 text-xs"
            />
          )}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 transform">
            <VoiceSearchButton
              onResult={(text) => setSearchQuery(text)}
              size="sm"
              variant="ghost"
              className="h-5 w-5"
            />
          </div>
        </div>
      </div>
      <div className={cn('max-h-[500px] space-y-1.5 overflow-y-auto p-2', isOps && 'wms-ops-receiving-area__list')}>
        {filteredItems.length === 0 ? (
          <div className={cn('py-8 text-center', isOps && 'wms-ops-panel-empty wms-ops-panel-empty--inline')}>
            <p className={cn('text-sm text-muted-foreground', isOps && 'wms-ops-panel-empty__hint')}>
              {t('common.noResults')}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const selectedItem = selectedItems.find((si) => si.id === item.id);
            return (
              <ReceivingItemRow
                key={item.id}
                item={item}
                selectedItem={selectedItem}
                warehouses={warehouses}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
                variant={variant}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
