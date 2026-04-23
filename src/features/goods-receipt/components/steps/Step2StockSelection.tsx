import { type ReactElement, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrdersByCustomer } from '../../hooks/useOrdersByCustomer';
import { goodsReceiptApi } from '../../api/goods-receipt-api';
import { lookupApi } from '@/services/lookup-api';
import type {
  GoodsReceiptFormData,
  SelectedStockItem,
  Product,
  OrderItem,
} from '../../types/goods-receipt';
import { ReceivingItemRow } from './components/ReceivingItemRow';
import { useWarehouses } from '../../hooks/useWarehouses';

interface Step2StockSelectionProps {
  selectedItems: SelectedStockItem[];
  onToggleItem: (item: Product) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2StockSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2StockSelectionProps): ReactElement {
  const { t } = useTranslation();
  const { watch } = useFormContext<GoodsReceiptFormData>();
  const customerCode = watch('customerId');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedQuery, setSearchSelectedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'selected'>('stocks');
  const stockListRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { data: warehouses = [] } = useWarehouses();
  const { data: orders } = useOrdersByCustomer(customerCode);
  const productsQuery = useInfiniteQuery({
    queryKey: ['goods-receipt', 'products', searchQuery],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      lookupApi.getProductsPaged(
        {
          pageNumber: pageParam,
          pageSize: 20,
          search: searchQuery.trim(),
        },
        { signal },
      ),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });

  const allOrderNumbers = useMemo(() => {
    if (!orders || orders.length === 0) return '';
    return orders.map((order) => order.siparisNo).join(',');
  }, [orders]);

  const { data: allOrderItems } = useQuery({
    queryKey: ['allOrderItems', customerCode, allOrderNumbers],
    queryFn: ({ signal }) => goodsReceiptApi.getOrderItems(customerCode!, allOrderNumbers, { signal }),
    enabled: !!customerCode && !!allOrderNumbers,
    staleTime: 5 * 60 * 1000,
  });

  const stockOrderQuantities = useMemo(() => {
    if (!allOrderItems) return new Map<string, number>();
    const quantities = new Map<string, number>();
    allOrderItems.forEach((item: OrderItem) => {
      const currentQty = quantities.get(item.stockCode) || 0;
      quantities.set(item.stockCode, currentQty + (item.remainingForImport || 0));
    });
    return quantities;
  }, [allOrderItems]);

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [productsQuery.data?.pages],
  );

  const selectedCountsByStockCode = useMemo(() => {
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });
    return counts;
  }, [selectedItems]);

  const handleStockListScroll = (index: number): void => {
    const element = stockListRefs.current[index];
    if (!element || productsQuery.isFetchingNextPage || !productsQuery.hasNextPage) {
      return;
    }

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 120) {
      void productsQuery.fetchNextPage();
    }
  };


  if (!customerCode) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle>{t('goodsReceipt.step2.selectCustomerFirst')}</CardTitle>
              <CardDescription>
                {t('goodsReceipt.step2.customerPrompt')}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stocks' | 'selected')} className="h-full flex flex-col">
            <div className="px-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stocks" className="w-full">
                  {t('goodsReceipt.step2.stocks')}
                </TabsTrigger>
                <TabsTrigger value="selected" className="w-full">
                  {t('goodsReceipt.step2.selectedItems')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stocks" className="m-0 min-h-0 flex-1 overflow-hidden">
              <div className="overflow-hidden min-w-0 flex h-full flex-col">
                <div className="p-4 border-b shrink-0">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('goodsReceipt.step2.searchStocks')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-10"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <VoiceSearchButton
                        onResult={(text) => setSearchQuery(text)}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </div>
                </div>
                <div
                  ref={(element) => {
                    stockListRefs.current[0] = element;
                  }}
                  onScroll={() => handleStockListScroll(0)}
                  className="flex-1 overflow-y-auto p-2 space-y-1"
                >
                  {productsQuery.isLoading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('common.loading')}
                      </span>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {t('common.notFound')}
                    </div>
                  ) : (
                    products.map((product) => {
                      const selectedCount = selectedCountsByStockCode.get(product.stokKodu) || 0;
                      return (
                        <div
                          key={product.stokKodu}
                          className={`p-3 rounded-md border transition-colors ${
                            selectedCount > 0
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {product.stokKodu}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {product.olcuBr1}
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">
                                {product.stokAdi}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {selectedCount > 0 && (
                                <Badge variant="default" className="shrink-0">
                                  {selectedCount}
                                </Badge>
                              )}
                              <Button type="button" size="sm" onClick={() => onToggleItem(product)}>
                                {t('common.add')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {productsQuery.isFetchingNextPage ? (
                    <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('common.loading')}
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="selected" className="m-0 min-h-0 flex-1 overflow-hidden">
              <div className="flex min-h-0 flex-col h-full">
                <div className="pb-2 space-y-2 border-b px-2 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">
                        {t('goodsReceipt.step2.selectedItems')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t('goodsReceipt.step2.itemsCount', { count: selectedItems.length })}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={t('goodsReceipt.step2.searchItems')}
                      value={searchSelectedQuery}
                      onChange={(e) => setSearchSelectedQuery(e.target.value)}
                      className="pl-7 pr-9 h-7 text-xs"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <VoiceSearchButton
                        onResult={(text) => setSearchSelectedQuery(text)}
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto space-y-1.5 p-2 flex-1">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        {t('goodsReceipt.step2.noSelectedItems')}
                      </p>
                    </div>
                  ) : (
                    selectedItems
                      .filter((item) => {
                        if (!searchSelectedQuery.trim()) return true;
                        const query = searchSelectedQuery.toLowerCase();
                        return item.stockCode.toLowerCase().includes(query) ||
                               item.stockName.toLowerCase().includes(query);
                      })
                      .map((item) => {
                        const orderQuantity = stockOrderQuantities.get(item.stockCode) || 0;
                        const orderItem: OrderItem = {
                          id: item.id,
                          mode: 'STOCK',
                          siparisNo: '',
                          orderID: 0,
                          stockCode: item.stockCode,
                          stockName: item.stockName,
                          customerCode: customerCode || '',
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
                          />
                        );
                      })
                      .filter(Boolean)
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden h-full lg:flex lg:flex-row lg:divide-x lg:divide-border">
          <div className="lg:w-[32%] xl:w-[30%] overflow-hidden min-w-0 flex flex-col border-r">
            <div className="p-4 border-b shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('goodsReceipt.step2.searchStocks')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton
                    onResult={(text) => setSearchQuery(text)}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
            <div
              ref={(element) => {
                stockListRefs.current[1] = element;
              }}
              onScroll={() => handleStockListScroll(1)}
              className="flex-1 overflow-y-auto p-2 space-y-1"
            >
              {productsQuery.isLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('common.loading')}
                  </span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t('common.notFound')}
                </div>
                  ) : (
                products.map((product) => {
                  const selectedCount = selectedCountsByStockCode.get(product.stokKodu) || 0;
                  return (
                    <div
                      key={product.stokKodu}
                      className={`p-3 rounded-md border transition-colors ${
                        selectedCount > 0
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {product.stokKodu}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {product.olcuBr1}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">
                            {product.stokAdi}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {selectedCount > 0 && (
                            <Badge variant="default" className="shrink-0">
                              {selectedCount}
                            </Badge>
                          )}
                          <Button type="button" size="sm" onClick={() => onToggleItem(product)}>
                            {t('common.add')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {productsQuery.isFetchingNextPage ? (
                <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
            <div className="flex flex-col h-full">
              <div className="pb-2 space-y-2 border-b px-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {t('goodsReceipt.step2.selectedItems')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('goodsReceipt.step2.itemsCount', { count: selectedItems.length })}
                    </p>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('goodsReceipt.step2.searchItems')}
                    value={searchSelectedQuery}
                    onChange={(e) => setSearchSelectedQuery(e.target.value)}
                    className="pl-7 pr-9 h-7 text-xs"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <VoiceSearchButton
                      onResult={(text) => setSearchSelectedQuery(text)}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto space-y-1.5 p-2 flex-1">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      {t('goodsReceipt.step2.noSelectedItems')}
                    </p>
                  </div>
                ) : (
                  selectedItems
                    .filter((item) => {
                      if (!searchSelectedQuery.trim()) return true;
                      const query = searchSelectedQuery.toLowerCase();
                      return item.stockCode.toLowerCase().includes(query) || 
                             item.stockName.toLowerCase().includes(query);
                    })
                    .map((item) => {
                      const orderQuantity = stockOrderQuantities.get(item.stockCode) || 0;
                      const orderItem: OrderItem = {
                        id: item.id,
                        mode: 'STOCK',
                        siparisNo: '',
                        orderID: 0,
                        stockCode: item.stockCode,
                        stockName: item.stockName,
                        customerCode: customerCode || '',
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
                        />
                      );
                    })
                    .filter(Boolean)
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
