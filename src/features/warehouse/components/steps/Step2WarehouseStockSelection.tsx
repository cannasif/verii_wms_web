import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/features/goods-receipt/hooks/useProducts';
import type { WarehouseFormData, SelectedWarehouseStockItem, WarehouseStockItem } from '../../types/warehouse';
import { WarehouseBulkItemRow } from './components/WarehouseBulkItemRow';

interface Step2WarehouseStockSelectionProps {
  selectedItems: SelectedWarehouseStockItem[];
  onToggleItem: (item: WarehouseStockItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2WarehouseStockSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2WarehouseStockSelectionProps): ReactElement {
  const { t } = useTranslation();
  const { watch } = useFormContext<WarehouseFormData>();
  const customerCode = watch('customerId');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedQuery, setSearchSelectedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'selected'>('stocks');
  const { data: products, isLoading: productsLoading } = useProducts();

  const mappedProducts = useMemo<WarehouseStockItem[]>(() => {
    return (products || []).map((product) => ({
      id: `stock-${product.stokKodu}`,
      stockCode: product.stokKodu,
      stockName: product.stokAdi,
      unit: product.olcuBr1,
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return mappedProducts;

    const query = searchQuery.toLowerCase();
    return mappedProducts.filter((product) => {
      return (
        product.stockCode.toLowerCase().includes(query) ||
        product.stockName.toLowerCase().includes(query)
      );
    });
  }, [mappedProducts, searchQuery]);

  const filteredSelectedItems = useMemo(() => {
    if (!searchSelectedQuery.trim()) return selectedItems;

    const query = searchSelectedQuery.toLowerCase();
    return selectedItems.filter((item) => {
      return item.stockCode.toLowerCase().includes(query) || item.stockName.toLowerCase().includes(query);
    });
  }, [searchSelectedQuery, selectedItems]);

  const selectedCountsByStockCode = useMemo(() => {
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });
    return counts;
  }, [selectedItems]);

  if (!customerCode) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-2xl font-semibold">1</span>
            </div>
            <div className="space-y-2">
              <CardTitle>{t('warehouse.step2.selectCustomerFirst')}</CardTitle>
              <CardDescription>{t('warehouse.step2.customerPrompt')}</CardDescription>
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
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'stocks' | 'selected')}
            className="h-full flex flex-col"
          >
            <div className="px-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stocks" className="w-full">
                  {t('warehouse.step2.stocks')}
                </TabsTrigger>
                <TabsTrigger value="selected" className="w-full">
                  {t('warehouse.step2.selectedItems')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stocks" className="m-0 min-h-0 flex-1 overflow-hidden">
              <StockListPane
                t={t}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                productsLoading={productsLoading}
                filteredProducts={filteredProducts}
                selectedCountsByStockCode={selectedCountsByStockCode}
                onToggleItem={onToggleItem}
              />
            </TabsContent>
            <TabsContent value="selected" className="m-0 min-h-0 flex-1 overflow-hidden">
              <SelectedListPane
                t={t}
                searchSelectedQuery={searchSelectedQuery}
                setSearchSelectedQuery={setSearchSelectedQuery}
                filteredSelectedItems={filteredSelectedItems}
                onToggleItem={onToggleItem}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden h-full lg:flex lg:flex-row lg:divide-x lg:divide-border">
          <div className="lg:w-[32%] xl:w-[30%] overflow-hidden min-w-0 flex h-full flex-col border-r">
            <StockListPane
              t={t}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              productsLoading={productsLoading}
              filteredProducts={filteredProducts}
              selectedCountsByStockCode={selectedCountsByStockCode}
              onToggleItem={onToggleItem}
            />
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <SelectedListPane
              t={t}
              searchSelectedQuery={searchSelectedQuery}
              setSearchSelectedQuery={setSearchSelectedQuery}
              filteredSelectedItems={filteredSelectedItems}
              onToggleItem={onToggleItem}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type TranslationFn = ReturnType<typeof useTranslation>['t'];

function StockListPane({
  t,
  searchQuery,
  setSearchQuery,
  productsLoading,
  filteredProducts,
  selectedCountsByStockCode,
  onToggleItem,
}: {
  t: TranslationFn;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  productsLoading: boolean;
  filteredProducts: WarehouseStockItem[];
  selectedCountsByStockCode: Map<string, number>;
  onToggleItem: (item: WarehouseStockItem) => void;
}): ReactElement {
  return (
    <div className="overflow-hidden min-w-0 flex h-full flex-col">
      <div className="p-4 border-b shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('warehouse.step2.searchStocks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceSearchButton onResult={(text) => setSearchQuery(text)} size="sm" variant="ghost" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {productsLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">{t('common.notFound')}</div>
        ) : (
          filteredProducts.map((product) => {
            const selectedCount = selectedCountsByStockCode.get(product.stockCode) || 0;
            return (
              <div
                key={product.id}
                className={`p-3 rounded-md border transition-colors ${
                  selectedCount > 0 ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {product.stockCode}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{product.unit}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{product.stockName}</p>
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
      </div>
    </div>
  );
}

function SelectedListPane({
  t,
  searchSelectedQuery,
  setSearchSelectedQuery,
  filteredSelectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: {
  t: TranslationFn;
  searchSelectedQuery: string;
  setSearchSelectedQuery: (value: string) => void;
  filteredSelectedItems: SelectedWarehouseStockItem[];
  onToggleItem: (item: WarehouseStockItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
}): ReactElement {
  return (
    <div className="flex min-h-0 flex-col h-full">
      <div className="pb-2 space-y-2 border-b px-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">{t('warehouse.step2.selectedItems')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('warehouse.step2.selectedItemsCount', { count: filteredSelectedItems.length })}
            </p>
          </div>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('warehouse.step2.searchItems')}
            value={searchSelectedQuery}
            onChange={(e) => setSearchSelectedQuery(e.target.value)}
            className="pl-7 pr-9 h-7 text-xs"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
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
        {filteredSelectedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{t('warehouse.step2.noSelectedItems')}</p>
          </div>
        ) : (
          filteredSelectedItems.map((item) => (
            <WarehouseBulkItemRow
              key={item.id}
              item={item}
              selectedItem={item}
              onUpdateItem={onUpdateItem}
              onToggleItem={onToggleItem}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>
    </div>
  );
}
