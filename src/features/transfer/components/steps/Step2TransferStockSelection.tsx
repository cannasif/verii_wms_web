import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/features/goods-receipt/hooks/useProducts';
import type { Product } from '@/features/goods-receipt/types/goods-receipt';
import type { SelectedTransferStockItem } from '../../types/transfer';
import { TransferStockItemRow } from './components/TransferStockItemRow';

interface Step2TransferStockSelectionProps {
  selectedItems: SelectedTransferStockItem[];
  onToggleItem: (item: Product) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedTransferStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function Step2TransferStockSelection({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: Step2TransferStockSelectionProps): ReactElement {
  const { t } = useTranslation();
  const [searchStocks, setSearchStocks] = useState('');
  const [searchSelected, setSearchSelected] = useState('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'selected'>('stocks');
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!searchStocks.trim()) return products;
    const term = searchStocks.toLowerCase();
    return products.filter(
      (product) =>
        product.stokKodu.toLowerCase().includes(term) ||
        product.stokAdi.toLowerCase().includes(term),
    );
  }, [products, searchStocks]);

  const filteredSelectedItems = useMemo(() => {
    if (!searchSelected.trim()) return selectedItems;
    const term = searchSelected.toLowerCase();
    return selectedItems.filter(
      (item) =>
        item.stockCode.toLowerCase().includes(term) ||
        item.stockName.toLowerCase().includes(term),
    );
  }, [searchSelected, selectedItems]);

  const selectedCountsByStockCode = useMemo(() => {
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });
    return counts;
  }, [selectedItems]);

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
                  {t('transfer.step2.stocks')}
                </TabsTrigger>
                <TabsTrigger value="selected" className="w-full">
                  {t('transfer.step2.selectedItems')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stocks" className="m-0 min-h-0 flex-1 overflow-hidden">
              <StockListPane
                t={t}
                searchStocks={searchStocks}
                setSearchStocks={setSearchStocks}
                isLoadingProducts={isLoadingProducts}
                filteredProducts={filteredProducts}
                selectedCountsByStockCode={selectedCountsByStockCode}
                onToggleItem={onToggleItem}
              />
            </TabsContent>
            <TabsContent value="selected" className="m-0 min-h-0 flex-1 overflow-hidden">
              <SelectedListPane
                t={t}
                searchSelected={searchSelected}
                setSearchSelected={setSearchSelected}
                filteredSelectedItems={filteredSelectedItems}
                products={products}
                onToggleItem={onToggleItem}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden min-h-[560px] lg:grid lg:grid-cols-[32%_1fr]">
          <div className="flex min-h-0 flex-col border-r">
            <StockListPane
              t={t}
              searchStocks={searchStocks}
              setSearchStocks={setSearchStocks}
              isLoadingProducts={isLoadingProducts}
              filteredProducts={filteredProducts}
              selectedCountsByStockCode={selectedCountsByStockCode}
              onToggleItem={onToggleItem}
            />
          </div>

          <div className="flex min-h-0 flex-col">
            <SelectedListPane
              t={t}
              searchSelected={searchSelected}
              setSearchSelected={setSearchSelected}
              filteredSelectedItems={filteredSelectedItems}
              products={products}
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
  searchStocks,
  setSearchStocks,
  isLoadingProducts,
  filteredProducts,
  selectedCountsByStockCode,
  onToggleItem,
}: {
  t: TranslationFn;
  searchStocks: string;
  setSearchStocks: (value: string) => void;
  isLoadingProducts: boolean;
  filteredProducts: Product[];
  selectedCountsByStockCode: Map<string, number>;
  onToggleItem: (item: Product) => void;
}): ReactElement {
  return (
    <>
      <div className="p-4 border-b">
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('transfer.step2.searchStocks')}
            value={searchStocks}
            onChange={(e) => setSearchStocks(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingProducts ? (
          <div className="text-center py-4 text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">{t('common.notFound')}</div>
        ) : (
          filteredProducts.map((product) => {
            const selectedCount = selectedCountsByStockCode.get(product.stokKodu) || 0;

            return (
              <div
                key={product.stokKodu}
                className={`p-3 rounded-md border transition-colors ${
                  selectedCount > 0 ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {product.stokKodu}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{product.olcuBr1}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{product.stokAdi}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedCount > 0 && <Badge variant="default">{selectedCount}</Badge>}
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
    </>
  );
}

function SelectedListPane({
  t,
  searchSelected,
  setSearchSelected,
  filteredSelectedItems,
  products,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
}: {
  t: TranslationFn;
  searchSelected: string;
  setSearchSelected: (value: string) => void;
  filteredSelectedItems: SelectedTransferStockItem[];
  products: Product[];
  onToggleItem: (item: Product) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedTransferStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
}): ReactElement {
  return (
    <>
      <div className="pb-2 space-y-2 border-b px-2 shrink-0">
        <div>
          <h3 className="font-semibold text-sm">{t('transfer.step2.selectedItems')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('transfer.step2.selectedItemsCount', { count: filteredSelectedItems.length })}
          </p>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('transfer.step2.searchItems')}
            value={searchSelected}
            onChange={(e) => setSearchSelected(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
        {filteredSelectedItems.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t('transfer.step2.noSelectedItems')}
          </div>
        ) : (
          filteredSelectedItems.map((selectedItem) => {
            const product = products.find((entry) => entry.stokKodu === selectedItem.stockCode);
            if (!product) return null;

            return (
              <TransferStockItemRow
                key={selectedItem.id}
                product={product}
                selectedItem={selectedItem}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
              />
            );
          })
        )}
      </div>
    </>
  );
}
