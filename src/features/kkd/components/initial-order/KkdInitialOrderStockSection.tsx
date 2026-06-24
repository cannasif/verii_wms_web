import type { ReactElement } from 'react';
import { OpsActionButton, OpsInput, PagedLookupDialog } from '@/components/shared';
import { SelectItem } from '@/components/ui/select';
import type { TFunction } from 'i18next';
import type { PagedResponse } from '@/types/api';
import type { KkdOrderContextDto, KkdOrderStockOptionDto } from '../../types/kkd.types';
import { KkdFlagChip, KkdOpsFormField, KkdOpsSection, KkdOpsSelect } from '../kkd-ops-ui';

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
    <KkdOpsSection title={t('kkd.operational.initialOrder.cardStock')}>
      <div className="space-y-4">
        <KkdOpsFormField label={t('kkd.operational.initialOrder.entitlementGroup')}>
          <KkdOpsSelect
            value={selectedGroupCode}
            onValueChange={onSelectedGroupCodeChange}
            placeholder={t('kkd.operational.initialOrder.groupPlaceholder')}
          >
            {eligibleGroups.map((group) => (
              <SelectItem key={group.groupCode} value={group.groupCode}>
                {group.groupCode} {group.groupName ? `- ${group.groupName}` : ''} ({group.remainingInitialQuantity})
              </SelectItem>
            ))}
          </KkdOpsSelect>
        </KkdOpsFormField>

        {selectedGroup ? (
          <div className="text-sm">
            <div className="flex flex-wrap gap-2">
              <KkdFlagChip>{selectedGroup.groupCode}</KkdFlagChip>
              <KkdFlagChip tone="info">
                {t('kkd.operational.initialOrder.initialEntitlement')}: {selectedGroup.remainingInitialQuantity}
              </KkdFlagChip>
              <KkdFlagChip tone="warn">
                {t('kkd.operational.initialOrder.remainingInCart')}: {remainingAfterCart}
              </KkdFlagChip>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.5fr_auto] md:gap-5">
          <KkdOpsFormField label={t('kkd.operational.initialOrder.stockLabel')}>
            <PagedLookupDialog<KkdOrderStockOptionDto>
              variant="ops"
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
          </KkdOpsFormField>
          <KkdOpsFormField label={t('common.quantity')}>
            <OpsInput type="number" min="1" step="1" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} />
          </KkdOpsFormField>
          <div className="flex items-end pb-0.5">
            <OpsActionButton type="button" onClick={onAddLine} disabled={!canAddLine}>
              {t('kkd.operational.initialOrder.add')}
            </OpsActionButton>
          </div>
        </div>
      </div>
    </KkdOpsSection>
  );
}
