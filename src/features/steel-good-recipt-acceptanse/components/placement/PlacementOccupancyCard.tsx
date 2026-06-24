import type { ReactElement } from 'react';
import { MasterDataOpsEmptyState, MasterDataOpsFlagChip, MasterDataOpsSection } from '@/features/shared';
import type { TFunction } from 'i18next';
import type { SteelGoodReciptAcceptanseLocationOccupancyItemDto } from '../../types/steel-good-recipt-acceptanse.types';

interface PlacementOccupancyCardProps {
  t: TFunction<'common'>;
  items: SteelGoodReciptAcceptanseLocationOccupancyItemDto[];
  isLoading: boolean;
}

export function PlacementOccupancyCard({ t, items, isLoading }: PlacementOccupancyCardProps): ReactElement {
  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.placement.sameLocationTitle')}>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.lineId}-${item.dCode}`} className="border border-[color-mix(in_oklab,var(--wms-ops-accent)_14%,var(--wms-ops-card-border))] p-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <MasterDataOpsFlagChip>{item.dCode}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone="info">{item.placementType}</MasterDataOpsFlagChip>
              {item.stackOrderNo ? <MasterDataOpsFlagChip>{t('steelGoodReceiptAcceptance.placement.stackBadge', { n: item.stackOrderNo })}</MasterDataOpsFlagChip> : null}
            </div>
            <div className="mt-2 font-medium">{item.serialNo}</div>
            <div className="text-sm opacity-70">{item.stockCode} • {item.supplierCode}</div>
          </div>
        ))}
        {!isLoading && items.length === 0 ? (
          <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.placement.noOther')}</MasterDataOpsEmptyState>
        ) : null}
      </div>
    </MasterDataOpsSection>
  );
}
