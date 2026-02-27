import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useWarehouseInboundOrderItems } from '../../../hooks/useWarehouseInboundOrderItems';
import { useWarehouseOutboundOrderItems } from '../../../hooks/useWarehouseOutboundOrderItems';
import { WarehouseItemRow } from './WarehouseItemRow';
import type { SelectedWarehouseOrderItem, WarehouseOrderItem } from '../../../types/warehouse';

type WarehouseType = 'inbound' | 'outbound';

interface WarehouseItemAreaProps {
  type: WarehouseType;
  siparisNo: string | null;
  selectedItems: SelectedWarehouseOrderItem[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedWarehouseOrderItem>) => void;
  onToggleItem: (item: WarehouseOrderItem) => void;
  onRemoveItem: (itemId: string) => void;
}

export function WarehouseItemArea({
  type,
  siparisNo,
  selectedItems,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
}: WarehouseItemAreaProps): ReactElement {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: inboundOrderItemsData, isLoading: inboundOrderItemsLoading } = useWarehouseInboundOrderItems(
    type === 'inbound' ? siparisNo ?? undefined : undefined
  );
  const { data: outboundOrderItemsData, isLoading: outboundOrderItemsLoading } = useWarehouseOutboundOrderItems(
    type === 'outbound' ? siparisNo ?? undefined : undefined
  );

  const orderItemsData = type === 'inbound' ? inboundOrderItemsData : outboundOrderItemsData;
  const isLoading = type === 'inbound' ? inboundOrderItemsLoading : outboundOrderItemsLoading;

  const mappedOrderItems = useMemo((): WarehouseOrderItem[] => {
    if (!orderItemsData?.data) return [];
    return orderItemsData.data.map((item) => ({
      ...item,
      id: `${item.siparisNo}-${item.stockCode}`,
    }));
  }, [orderItemsData]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mappedOrderItems;
    const query = searchQuery.toLowerCase();
    return mappedOrderItems.filter((item) => {
      const codeMatch = item.stockCode?.toLowerCase().includes(query);
      const nameMatch = item.stockName?.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [mappedOrderItems, searchQuery]);

  if (!siparisNo) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <PackageOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <CardTitle>{t('warehouse.step2.noOrderSelected', 'Sipariş Seçimi')}</CardTitle>
              <CardDescription>
                {t('warehouse.step2.selectOrderPrompt', 'İşlem yapmak için siparişler sekmesinden bir sipariş seçiniz.')}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!mappedOrderItems || mappedOrderItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <PackageOpen className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {t('warehouse.step2.noItemsFound', 'Bu siparişte ürün bulunamadı.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = mappedOrderItems.length;
  const startedItems = mappedOrderItems.filter((item) =>
    selectedItems.some((si) => si.id === item.id && si.transferQuantity > 0)
  ).length;

  return (
    <div className="flex flex-col h-full">
      <div className="pb-2 space-y-2 border-b px-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">{t('warehouse.step2.orderContent', 'Sipariş İçeriği')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('warehouse.step2.itemsCount', '{{count}} kalem ürün', { count: totalItems })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('warehouse.step2.started', 'Başlanan')}</p>
            <p className="text-sm font-semibold">
              {startedItems}/{totalItems}
            </p>
          </div>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('warehouse.step2.searchItems', 'Stok kodu veya adı ile ara...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-9 h-7 text-xs"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <VoiceSearchButton
              onResult={(text) => setSearchQuery(text)}
              size="sm"
              variant="ghost"
              className="h-5 w-5"
            />
          </div>
        </div>
      </div>
      <div className="overflow-y-auto space-y-1.5 p-2 max-h-[500px]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('common.noResults', 'Sonuç bulunamadı')}</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const selectedItem = selectedItems.find((si) => si.id === item.id);
            return (
              <WarehouseItemRow
                key={item.id}
                item={item}
                selectedItem={selectedItem}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

