import { type ReactElement, type UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Inbox, Loader2, Search } from 'lucide-react';
import { OpsActionButton, OpsInput } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { cn } from '@/lib/utils';
import { goodsReceiptApi } from '../../../api/goods-receipt-api';
import { useOrdersByCustomer } from '../../../hooks/useOrdersByCustomer';
import type {
  GoodsReceiptFormData,
  OrderItem,
  SelectedOrderItem,
} from '../../../types/goods-receipt';

const ORDER_BATCH_SIZE = 20;

interface OrderFetchSelectionPanelProps {
  selectedItems: SelectedOrderItem[];
  onToggleItem: (item: OrderItem) => void;
  variant?: 'default' | 'ops';
}

function mapOrderItem(item: OrderItem, index: number): OrderItem {
  return {
    ...item,
    id: item.id || `${item.orderID}-${item.stockCode}-${item.siparisNo}-${index}`,
    productCode: item.stockCode,
    productName: item.stockName,
    quantity: item.remainingForImport,
    unit: item.unit,
    unitPrice: 0,
    totalPrice: 0,
  };
}

export function OrderFetchSelectionPanel({
  selectedItems,
  onToggleItem,
  variant = 'ops',
}: OrderFetchSelectionPanelProps): ReactElement | null {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const { watch } = useFormContext<GoodsReceiptFormData>();
  const customerCode = watch('customerId');
  const isOps = variant === 'ops';
  const scrollRef = useRef<HTMLDivElement>(null);

  const [fetchRequested, setFetchRequested] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ORDER_BATCH_SIZE);

  useEffect(() => {
    setFetchRequested(false);
    setVisibleCount(ORDER_BATCH_SIZE);
    setSearchQuery('');
  }, [customerCode]);

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    refetch: refetchOrders,
  } = useOrdersByCustomer(customerCode, { enabled: fetchRequested });

  const orderNumbersCsv = useMemo(
    () => orders.map((order) => order.siparisNo).filter(Boolean).join(','),
    [orders],
  );

  const {
    data: orderLines = [],
    isLoading: linesLoading,
    isFetching: linesFetching,
    refetch: refetchLines,
  } = useQuery({
    queryKey: ['goods-receipt-order-fetch-lines', customerCode, orderNumbersCsv],
    queryFn: ({ signal }) => goodsReceiptApi.getOrderItems(customerCode!, orderNumbersCsv, { signal }),
    enabled: fetchRequested && !!customerCode && orderNumbersCsv.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const mappedLines = useMemo(
    () => orderLines.map((item, index) => mapOrderItem(item, index)),
    [orderLines],
  );

  // Search always runs on the full loaded set (sipariş no / proje / stok kod-ad).
  const filteredLines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mappedLines;

    return mappedLines.filter((item) => {
      const siparisNo = item.siparisNo?.toLowerCase() || '';
      const projectCode = item.projectCode?.toLowerCase() || '';
      const stockCode = (item.stockCode || item.productCode || '').toLowerCase();
      const stockName = (item.stockName || item.productName || '').toLowerCase();

      return (
        siparisNo.includes(query)
        || projectCode.includes(query)
        || stockCode.includes(query)
        || stockName.includes(query)
      );
    });
  }, [mappedLines, searchQuery]);

  useEffect(() => {
    setVisibleCount(ORDER_BATCH_SIZE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [searchQuery, fetchRequested, orderLines.length]);

  const visibleRows = filteredLines.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLines.length;

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((item) => item.id)),
    [selectedItems],
  );

  const allFilteredSelected = filteredLines.length > 0
    && filteredLines.every((item) => selectedIds.has(item.id || ''));
  const someFilteredSelected = filteredLines.some((item) => selectedIds.has(item.id || ''));

  const isLoading = fetchRequested && (ordersLoading || ordersFetching || linesLoading || linesFetching);

  const handleFetch = (): void => {
    if (!customerCode) return;
    setVisibleCount(ORDER_BATCH_SIZE);
    if (fetchRequested) {
      void refetchOrders().then(() => {
        void refetchLines();
      });
      return;
    }
    setFetchRequested(true);
  };

  const handleToggleAll = (): void => {
    if (allFilteredSelected) {
      filteredLines.forEach((item) => {
        if (selectedIds.has(item.id || '')) {
          onToggleItem(item);
        }
      });
      return;
    }

    filteredLines.forEach((item) => {
      if (!selectedIds.has(item.id || '')) {
        onToggleItem(item);
      }
    });
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>): void => {
    if (!hasMore) return;
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 48;
    if (nearBottom) {
      setVisibleCount((prev) => Math.min(prev + ORDER_BATCH_SIZE, filteredLines.length));
    }
  };

  if (!customerCode) {
    return null;
  }

  return (
    <div className={cn('space-y-4', isOps && 'wms-ops-order-fetch')}>
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', isOps && 'wms-ops-order-fetch__toolbar')}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] size-3.5 -translate-y-1/2" aria-hidden />
          <OpsInput
            placeholder={t('goodsReceipt.step2.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={cn(OPS_FIELD_CLASS, 'h-10 pl-8 text-xs')}
            disabled={!fetchRequested || isLoading}
          />
        </div>
        <OpsActionButton
          type="button"
          variant="primary"
          onClick={handleFetch}
          disabled={isLoading}
          className="h-10 w-full shrink-0 sm:w-auto sm:min-w-[11rem]"
        >
          {isLoading ? t('common.loading') : t('goodsReceipt.step2.fetchOrders')}
        </OpsActionButton>
      </div>

      {!fetchRequested ? (
        <div className="wms-ops-panel-empty py-10">
          <Inbox className="size-6" aria-hidden />
          <p className="wms-ops-panel-empty__title">{t('goodsReceipt.step2.fetchOrdersPrompt')}</p>
          <p className="wms-ops-panel-empty__hint">{t('goodsReceipt.step2.fetchOrdersHint')}</p>
        </div>
      ) : isLoading ? (
        <div className="wms-ops-panel-empty py-10">
          <Loader2 className="size-6 animate-spin" aria-hidden />
          <p>{t('common.loading')}</p>
        </div>
      ) : filteredLines.length === 0 ? (
        <div className="wms-ops-panel-empty py-10">
          <Inbox className="size-6" aria-hidden />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className={cn('space-y-3', isOps && 'wms-ops-order-fetch__grid')}>
          <div
            ref={scrollRef}
            className="wms-ops-order-fetch__table-wrap"
            onScroll={handleScroll}
          >
            <table className="wms-ops-order-fetch__table w-full min-w-[720px] border-collapse text-left text-xs">
              <thead>
                <tr>
                  <th className="w-14 px-2 py-2 text-center">
                    <label className="wms-ops-order-checkbox" title={t('goodsReceipt.step2.selectAll')}>
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = someFilteredSelected && !allFilteredSelected;
                          }
                        }}
                        onChange={handleToggleAll}
                        aria-label={t('goodsReceipt.step2.selectAll')}
                      />
                      <span className="wms-ops-order-checkbox__mark" aria-hidden />
                    </label>
                  </th>
                  <th className="px-2 py-2">{t('goodsReceipt.step2.orderNo')}</th>
                  <th className="px-2 py-2">{t('goodsReceipt.step2.projectCode')}</th>
                  <th className="px-2 py-2">{t('goodsReceipt.step2.stockCode')}</th>
                  <th className="px-2 py-2">{t('goodsReceipt.step2.stockName')}</th>
                  <th className="wms-ops-order-fetch__qty px-2 py-2">{t('goodsReceipt.step2.remaining')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((item) => {
                  const itemId = item.id || '';
                  const checked = selectedIds.has(itemId);
                  return (
                    <tr
                      key={itemId}
                      className={cn(
                        'cursor-pointer',
                        checked && 'wms-ops-order-fetch__row--selected',
                      )}
                      onClick={() => onToggleItem(item)}
                    >
                      <td className="px-2 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                        <label className="wms-ops-order-checkbox">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleItem(item)}
                            aria-label={t('goodsReceipt.step2.select')}
                          />
                          <span className="wms-ops-order-checkbox__mark" aria-hidden />
                        </label>
                      </td>
                      <td className="px-2 py-2 font-mono">{item.siparisNo}</td>
                      <td className="px-2 py-2">{item.projectCode || '-'}</td>
                      <td className="px-2 py-2 font-mono">{item.stockCode || item.productCode}</td>
                      <td className="px-2 py-2">{item.stockName || item.productName}</td>
                      <td className="wms-ops-order-fetch__qty px-2 py-2 font-medium">
                        {(item.remainingForImport ?? item.quantity ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('goodsReceipt.step2.selectedCount', { count: selectedItems.length })}
            {' · '}
            {t('goodsReceipt.step2.visibleCount', {
              visible: visibleRows.length,
              total: filteredLines.length,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
