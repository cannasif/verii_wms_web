import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '../../hooks/useProducts';
import { useOrdersByCustomer } from '../../hooks/useOrdersByCustomer';
import { goodsReceiptApi } from '../../api/goods-receipt-api';
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
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: orders } = useOrdersByCustomer(customerCode);

  const allOrderNumbers = useMemo(() => {
    if (!orders || orders.length === 0) return '';
    return orders.map((order) => order.siparisNo).join(',');
  }, [orders]);

  const { data: allOrderItems } = useQuery({
    queryKey: ['allOrderItems', customerCode, allOrderNumbers],
    queryFn: () => goodsReceiptApi.getOrderItems(customerCode!, allOrderNumbers),
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

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const stockCode = product.stokKodu.toLowerCase();
      const stockName = product.stokAdi.toLowerCase();
      return stockCode.includes(query) || stockName.includes(query);
    });
  }, [products, searchQuery]);


  if (!customerCode) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle>{t('goodsReceipt.step2.selectCustomerFirst', 'Önce Müşteri Seçiniz')}</CardTitle>
              <CardDescription>
                {t('goodsReceipt.step2.customerPrompt', 'Stokları görüntülemek için lütfen önceki adımdan bir müşteri seçin.')}
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
        <div className="flex flex-row h-full divide-x divide-border">
          <div className="w-[30%] overflow-hidden min-w-0 flex flex-col border-r">
            <div className="p-4 border-b shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('goodsReceipt.step2.searchStocks', 'Stok kodu veya adı ile ara...')}
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
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[380px]">
              {productsLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t('common.notFound', 'Bulunamadı')}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedItems.some((item) => item.stockCode === product.stokKodu);
                  return (
                    <div
                      key={product.stokKodu}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => onToggleItem(product)}
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
                        {isSelected && (
                          <Badge variant="default" className="shrink-0">
                            {t('common.selected', 'Seçili')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-w-0 flex flex-col">
            <div className="flex flex-col h-full">
              <div className="pb-2 space-y-2 border-b px-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {t('goodsReceipt.step2.selectedItems', 'Seçili Stoklar')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('goodsReceipt.step2.itemsCount', '{{count}} kalem ürün', { count: selectedItems.length })}
                    </p>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('goodsReceipt.step2.searchItems', 'Stok kodu veya adı ile ara...')}
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
                      {t('goodsReceipt.step2.noSelectedItems', 'Seçili stok bulunmamaktadır')}
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
                      const product = products?.find((p) => p.stokKodu === item.stockCode);
                      const orderQuantity = stockOrderQuantities.get(item.stockCode) || 0;
                      const orderItem: OrderItem | null = product ? {
                        id: item.stockCode,
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
                      } : null;
                      if (!orderItem) return null;
                      return (
                        <ReceivingItemRow
                          key={item.stockCode}
                          item={orderItem}
                          selectedItem={item}
                          warehouses={warehouses}
                          onUpdateItem={(_itemId, updates) => onUpdateItem(item.stockCode, updates)}
                          onToggleItem={() => {}}
                          onRemoveItem={(_itemId) => onRemoveItem(item.stockCode)}
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

