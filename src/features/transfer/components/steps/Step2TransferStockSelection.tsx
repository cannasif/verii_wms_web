import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products, isLoading: isLoadingProducts } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!searchTerm || !products) return products || [];
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product: Product) =>
        product.stokKodu.toLowerCase().includes(term) ||
        product.stokAdi.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0">
          <CardTitle>{t('transfer.step2.stockSelection')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0">
          <div className="mb-4 shrink-0">
            <Input
              placeholder={t('transfer.step2.searchStocks')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-4">{t('common.loading')}</div>
          ) : (
            <div 
              className="overflow-y-auto space-y-1.5 flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
              style={{ maxHeight: '40vh' }}
            >
              {filteredProducts.map((product) => {
                const itemId = `stock-${product.stokKodu}`;
                const selectedItem = selectedItems.find((si) => si.id === itemId);

                return (
                  <TransferStockItemRow
                    key={product.stokKodu}
                    product={product}
                    selectedItem={selectedItem}
                    onUpdateItem={onUpdateItem}
                    onToggleItem={onToggleItem}
                    onRemoveItem={onRemoveItem}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

