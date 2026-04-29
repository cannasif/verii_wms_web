import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import type { TFunction } from 'i18next';
import type { PagedResponse } from '@/types/api';
import type { KkdOrderContextDto, KkdOrderStockOptionDto } from '../../types/kkd.types';

interface KkdInitialOrderStockSectionProps {
  t: TFunction<'common'>;
  eligibleGroups: KkdOrderContextDto['eligibleGroups'];
  selectedGroupCode: string;
  onSelectedGroupCodeChange: (value: string) => void;
  selectedGroup: KkdOrderContextDto['eligibleGroups'][number] | null;
  remainingAfterCart: number;
  stockDialogOpen: boolean;
  onStockDialogOpenChange: (open: boolean) => void;
  selectedStock: KkdOrderStockOptionDto | null;
  onSelectStock: (item: KkdOrderStockOptionDto) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  canAddLine: boolean;
  onAddLine: () => void;
  fetchStocks: (args: {
    pageNumber: number;
    pageSize: number;
    search: string;
    signal?: AbortSignal;
  }) => Promise<PagedResponse<KkdOrderStockOptionDto>>;
}

export function KkdInitialOrderStockSection({
  t,
  eligibleGroups,
  selectedGroupCode,
  onSelectedGroupCodeChange,
  selectedGroup,
  remainingAfterCart,
  stockDialogOpen,
  onStockDialogOpenChange,
  selectedStock,
  onSelectStock,
  quantity,
  onQuantityChange,
  canAddLine,
  onAddLine,
  fetchStocks,
}: KkdInitialOrderStockSectionProps): ReactElement {
  return (
    <Card>
      <CardHeader><CardTitle>{t('kkd.operational.initialOrder.cardStock')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('kkd.operational.initialOrder.entitlementGroup')}</Label>
          <Select value={selectedGroupCode} onValueChange={onSelectedGroupCodeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('kkd.operational.initialOrder.groupPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {eligibleGroups.map((group) => (
                <SelectItem key={group.groupCode} value={group.groupCode}>
                  {group.groupCode} {group.groupName ? `- ${group.groupName}` : ''} ({group.remainingInitialQuantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGroup ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap gap-2">
              <Badge>{selectedGroup.groupCode}</Badge>
              <Badge variant="secondary">
                {t('kkd.operational.initialOrder.initialEntitlement')}: {selectedGroup.remainingInitialQuantity}
              </Badge>
              <Badge variant="outline">
                {t('kkd.operational.initialOrder.remainingInCart')}: {remainingAfterCart}
              </Badge>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.5fr_auto]">
          <div className="space-y-2">
            <Label>{t('kkd.operational.initialOrder.stockLabel')}</Label>
            <PagedLookupDialog<KkdOrderStockOptionDto>
              open={stockDialogOpen}
              onOpenChange={onStockDialogOpenChange}
              title={t('kkd.operational.initialOrder.selectStock')}
              value={selectedStock ? `${selectedStock.stockCode} - ${selectedStock.stockName}` : null}
              placeholder={selectedGroupCode ? t('kkd.operational.initialOrder.groupStockPlaceholder') : t('kkd.operational.initialOrder.selectGroupFirst')}
              searchPlaceholder={t('kkd.operational.initialOrder.stockSearchPlaceholder')}
              queryKey={['kkd', 'order', 'stocks', selectedGroupCode]}
              disabled={!selectedGroupCode}
              fetchPage={fetchStocks}
              getKey={(item) => String(item.stockId)}
              getLabel={(item) => `${item.stockCode} - ${item.stockName}`}
              onSelect={onSelectStock}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('common.quantity')}</Label>
            <Input type="number" min="1" step="1" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={onAddLine} disabled={!canAddLine}>
              {t('kkd.operational.initialOrder.add')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
