import type { ReactElement } from 'react';
import { OpsActionButton, OpsInput } from '@/components/shared';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
} from '@/features/shared';
import type { TFunction } from 'i18next';
import { localizeStatus } from '@/lib/localize-status';
import type { SteelGoodReciptAcceptanseLineListItemDto } from '../../types/steel-good-recipt-acceptanse.types';

interface PlacementCandidatesCardProps {
  t: TFunction<'common'>;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  candidates: SteelGoodReciptAcceptanseLineListItemDto[];
  selectedLine: SteelGoodReciptAcceptanseLineListItemDto | null;
  onSelectLine: (row: SteelGoodReciptAcceptanseLineListItemDto) => void;
  isLoading: boolean;
}

export function PlacementCandidatesCard({
  t,
  searchInput,
  onSearchInputChange,
  onSearch,
  candidates,
  selectedLine,
  onSelectLine,
  isLoading,
}: PlacementCandidatesCardProps): ReactElement {
  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.placement.title')}>
      <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.placement.searchPh')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1">
            <OpsInput value={searchInput} onChange={(event) => onSearchInputChange(event.target.value)} placeholder={t('steelGoodReceiptAcceptance.placement.searchPh')} />
          </div>
          <OpsActionButton type="button" variant="secondary" onClick={onSearch}>{t('common.search')}</OpsActionButton>
        </div>
      </MasterDataOpsFormField>

      <div className="mt-4 space-y-3">
        {candidates.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelectLine(row)}
            className={`wms-ops-kkd-quick-link w-full text-left ${
              selectedLine?.id === row.id ? 'ring-1 ring-[color-mix(in_oklab,var(--wms-ops-accent)_55%,transparent)]' : ''
            }`}
          >
            <div className="flex flex-wrap gap-2 text-sm">
              <MasterDataOpsFlagChip>{row.dCode}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone="info">{row.stockCode}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip>{localizeStatus(row.status, t)}</MasterDataOpsFlagChip>
            </div>
            <div className="mt-2 font-medium">{row.serialNo}</div>
            <div className="text-sm opacity-70">{row.supplierCode} - {row.supplierName}</div>
            <div className="mt-1 text-sm">{t('steelGoodReceiptAcceptance.placement.approvedQty')}: <span className="font-medium">{row.approvedQuantity}</span></div>
          </button>
        ))}
        {!isLoading && candidates.length === 0 ? (
          <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.placement.noPending')}</MasterDataOpsEmptyState>
        ) : null}
      </div>
    </MasterDataOpsSection>
  );
}
