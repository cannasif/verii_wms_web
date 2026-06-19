import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useOrdersByCustomer } from '../../hooks/useOrdersByCustomer';
import { goodsReceiptApi } from '../../api/goods-receipt-api';
import type {
  GoodsReceiptFormData,
  SelectedStockItem,
  Product,
  OrderItem,
} from '../../types/goods-receipt';
import { StockSelectionPanel } from './components/StockSelectionPanel';
import { SelectedStockArea } from './components/SelectedStockArea';
import { useWarehouses } from '../../hooks/useWarehouses';

interface Step2StockSelectionProps {
  selectedItems: SelectedStockItem[];
  onToggleItem: (item: Product) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveLastOfStock?: (stockCode: string) => void;
  onClearStockSelection?: (stockCode: string) => void;
  variant?: 'default' | 'ops';
}

export function Step2StockSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
  onRemoveLastOfStock,
  onClearStockSelection,
  variant = 'default',
}: Step2StockSelectionProps): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const { watch } = useFormContext<GoodsReceiptFormData>();
  const customerCode = watch('customerId');
  const [activeTab, setActiveTab] = useState<'stocks' | 'selected'>('stocks');
  const [stockPageNumber, setStockPageNumber] = useState(1);
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const isOps = variant === 'ops';
  const { data: warehouses = [] } = useWarehouses();
  const { data: orders } = useOrdersByCustomer(customerCode);

  const allOrderNumbers = useMemo(() => {
    if (!orders || orders.length === 0) {
      return '';
    }

    return orders.map((order) => order.siparisNo).join(',');
  }, [orders]);

  const { data: allOrderItems } = useQuery({
    queryKey: ['allOrderItems', customerCode, allOrderNumbers],
    queryFn: ({ signal }) => goodsReceiptApi.getOrderItems(customerCode!, allOrderNumbers, { signal }),
    enabled: !!customerCode && !!allOrderNumbers,
    staleTime: 5 * 60 * 1000,
  });

  const stockOrderQuantities = useMemo(() => {
    if (!allOrderItems) {
      return new Map<string, number>();
    }

    const quantities = new Map<string, number>();
    allOrderItems.forEach((item: OrderItem) => {
      const currentQty = quantities.get(item.stockCode) || 0;
      quantities.set(item.stockCode, currentQty + (item.remainingForImport || 0));
    });
    return quantities;
  }, [allOrderItems]);

  const selectedCountsByStockCode = useMemo(() => {
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });
    return counts;
  }, [selectedItems]);

  if (!customerCode) {
    return (
      <Card className={cn(isOps && 'wms-ops-order-step')}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="max-w-sm space-y-4 text-center">
            <div
              className={cn(
                'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                isOps ? 'wms-ops-panel-empty__icon' : 'bg-muted',
              )}
            >
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle className={cn(isOps && 'wms-ops-panel-empty__title')}>
                {t('goodsReceipt.step2.selectCustomerFirst')}
              </CardTitle>
              <CardDescription className={cn(isOps && 'wms-ops-panel-empty__hint')}>
                {t('goodsReceipt.step2.customerPrompt')}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stockPanelProps = {
    variant,
    selectedCountsByStockCode,
    onToggleItem,
    onRemoveLastOfStock,
    onClearStockSelection,
    pageNumber: stockPageNumber,
    onPageChange: setStockPageNumber,
  };

  const selectedPanelProps = {
    variant,
    customerCode,
    selectedItems,
    stockOrderQuantities,
    warehouses,
    onUpdateItem,
    onRemoveItem,
    pageNumber: selectedPageNumber,
    onPageChange: setSelectedPageNumber,
  };

  return (
    <Card className={cn('flex flex-col', isOps && 'wms-ops-order-step')}>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="lg:hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'stocks' | 'selected')}
            className="flex h-full flex-col"
          >
            <div className={cn('border-b px-4 py-2', isOps && 'wms-ops-order-step__mobile-tabs')}>
              <TabsList
                className={cn(
                  'grid w-full grid-cols-2',
                  isOps && 'wms-ops-tabs wms-ops-step-tabs',
                  isOps && (activeTab === 'stocks' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock'),
                )}
              >
                {isOps ? <span className="wms-ops-tab-indicator wms-ops-step-tab-indicator" aria-hidden /> : null}
                <TabsTrigger value="stocks" className={cn('w-full', isOps && 'wms-ops-tab')}>
                  {t('goodsReceipt.step2.stocks')}
                </TabsTrigger>
                <TabsTrigger value="selected" className={cn('w-full', isOps && 'wms-ops-tab')}>
                  {t('goodsReceipt.step2.selectedItems')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stocks" className="m-0 mt-0 min-h-0 flex-1 overflow-hidden">
              <StockSelectionPanel key="stock-panel-mobile" {...stockPanelProps} />
            </TabsContent>
            <TabsContent value="selected" className="m-0 mt-0 min-h-0 flex-1 overflow-hidden">
              <SelectedStockArea key="selected-panel-mobile" {...selectedPanelProps} />
            </TabsContent>
          </Tabs>
        </div>

        <div
          className={cn(
            'hidden h-full min-h-[520px] lg:flex lg:flex-row',
            isOps
              ? 'lg:divide-x lg:divide-[color-mix(in_oklab,var(--wms-ops-accent)_18%,var(--wms-ops-card-border))]'
              : 'lg:divide-x lg:divide-border',
          )}
        >
          <div className="flex min-w-0 flex-col overflow-hidden lg:w-[32%] xl:w-[30%]">
            <StockSelectionPanel key="stock-panel-desktop" {...stockPanelProps} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <SelectedStockArea key="selected-panel-desktop" {...selectedPanelProps} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
