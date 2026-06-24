import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageOpen, Search, Loader2 } from 'lucide-react';
import { OpsFieldShell, OpsInput } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { Input } from '@/components/ui/input';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSubcontractingReceiptOrderItems } from '../../../hooks/useSubcontractingReceiptOrderItems';
import { useSubcontractingIssueOrderItems } from '../../../hooks/useSubcontractingIssueOrderItems';
import { SubcontractingItemRow } from './SubcontractingItemRow';
import type { SelectedSubcontractingOrderItem, SubcontractingOrderItem } from '../../../types/subcontracting';

type SubcontractingType = 'receipt' | 'issue';

interface SubcontractingItemAreaProps {
  type: SubcontractingType;
  siparisNo: string | null;
  selectedItems: SelectedSubcontractingOrderItem[];
  onUpdateItem: (itemId: string, updates: Partial<SelectedSubcontractingOrderItem>) => void;
  onToggleItem: (item: SubcontractingOrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  variant?: 'default' | 'ops';
}

export function SubcontractingItemArea({
  type,
  siparisNo,
  selectedItems,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  variant = 'default',
}: SubcontractingItemAreaProps): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const isOps = variant === 'ops';

  const { data: receiptOrderItemsData, isLoading: receiptOrderItemsLoading } = useSubcontractingReceiptOrderItems(
    type === 'receipt' ? siparisNo ?? undefined : undefined,
  );
  const { data: issueOrderItemsData, isLoading: issueOrderItemsLoading } = useSubcontractingIssueOrderItems(
    type === 'issue' ? siparisNo ?? undefined : undefined,
  );

  const orderItemsData = type === 'receipt' ? receiptOrderItemsData : issueOrderItemsData;
  const isLoading = type === 'receipt' ? receiptOrderItemsLoading : issueOrderItemsLoading;

  const mappedOrderItems = useMemo((): SubcontractingOrderItem[] => {
    if (!orderItemsData?.data) return [];
    return orderItemsData.data.map((item) => ({
      ...item,
      id: `${item.siparisNo}-${item.stockCode}`,
    }));
  }, [orderItemsData]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mappedOrderItems;
    const query = searchQuery.toLowerCase();
    return mappedOrderItems.filter((item) => (
      item.stockCode?.toLowerCase().includes(query)
      || item.stockName?.toLowerCase().includes(query)
    ));
  }, [mappedOrderItems, searchQuery]);

  if (!siparisNo) {
    return isOps ? (
      <div className="wms-ops-panel-empty wms-ops-panel-empty--detail">
        <PackageOpen className="size-8" aria-hidden />
        <p className="wms-ops-panel-empty__title">{t('subcontracting.step2.noOrderSelected')}</p>
        <p className="wms-ops-panel-empty__hint">{t('subcontracting.step2.selectOrderPrompt')}</p>
      </div>
    ) : (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <CardTitle>{t('subcontracting.step2.noOrderSelected')}</CardTitle>
              <CardDescription>{t('subcontracting.step2.selectOrderPrompt')}</CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return isOps ? (
      <div className="wms-ops-panel-empty">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <p>{t('common.loading')}</p>
      </div>
    ) : (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!mappedOrderItems || mappedOrderItems.length === 0) {
    return isOps ? (
      <div className="wms-ops-panel-empty">
        <PackageOpen className="size-8" aria-hidden />
        <p>{t('subcontracting.step2.noItemsFound')}</p>
      </div>
    ) : (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">{t('subcontracting.step2.noItemsFound')}</p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = mappedOrderItems.length;
  const startedItems = mappedOrderItems.filter((item) =>
    selectedItems.some((selected) => selected.id === item.id && selected.transferQuantity > 0),
  ).length;

  return (
    <div className="flex h-full flex-col">
      <div className={cn('shrink-0 space-y-2 border-b px-2 pb-2', isOps && 'wms-ops-order-panel__search')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className={cn('text-sm font-semibold', isOps && 'font-mono text-[0.68rem] tracking-[0.1em] uppercase')}>
              {t('subcontracting.step2.orderContent')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('subcontracting.step2.itemsCount', { count: totalItems })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('subcontracting.step2.started')}</p>
            <p className="text-sm font-semibold">{startedItems}/{totalItems}</p>
          </div>
        </div>
        {isOps ? (
          <OpsFieldShell className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 z-[1] size-3.5 -translate-y-1/2" aria-hidden />
            <OpsInput
              placeholder={t('subcontracting.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(OPS_FIELD_CLASS, 'h-9 pl-8 pr-10 text-xs')}
            />
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" className="wms-ops-voice-btn" />
            </div>
          </OpsFieldShell>
        ) : (
          <div className="relative flex items-center">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('subcontracting.step2.searchItems')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-7 pr-9 pl-7 text-xs"
            />
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <VoiceSearchButton onResult={setSearchQuery} size="sm" variant="ghost" className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
      <div className={cn('max-h-[500px] space-y-1.5 overflow-y-auto p-2', isOps && 'wms-ops-order-panel__list')}>
        {filteredItems.length === 0 ? (
          <div className={cn('py-8 text-center', isOps && 'wms-ops-panel-empty')}>
            <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const selectedItem = selectedItems.find((selected) => selected.id === item.id);
            return (
              <SubcontractingItemRow
                key={item.id}
                item={item}
                selectedItem={selectedItem}
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
