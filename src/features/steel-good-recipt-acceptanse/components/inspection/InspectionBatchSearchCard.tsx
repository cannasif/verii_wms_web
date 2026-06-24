import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput } from '@/components/shared';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
} from '@/features/shared';
import type { InspectionBatch } from './shared';

interface InspectionBatchSearchCardProps {
  uniqueValueInput: string;
  onUniqueValueInputChange: (value: string) => void;
  onSearch: () => void;
  batches?: InspectionBatch[];
  selectedBatch: InspectionBatch | null;
  onSelectBatch: (batch: InspectionBatch) => void;
  hasSearched: boolean;
  isLoading: boolean;
}

export function InspectionBatchSearchCard({
  uniqueValueInput,
  onUniqueValueInputChange,
  onSearch,
  batches,
  selectedBatch,
  onSelectBatch,
  hasSearched,
  isLoading,
}: InspectionBatchSearchCardProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.inspection.findBatch')}>
      <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.batchSearchPh')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1">
            <OpsInput
              value={uniqueValueInput}
              onChange={(event) => onUniqueValueInputChange(event.target.value)}
              placeholder={t('steelGoodReceiptAcceptance.inspection.batchSearchPh')}
            />
          </div>
          <OpsActionButton type="button" variant="secondary" onClick={onSearch}>
            {t('steelGoodReceiptAcceptance.inspection.findBatchBtn')}
          </OpsActionButton>
        </div>
      </MasterDataOpsFormField>

      {batches?.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {batches.map((batch) => (
            <button
              key={batch.headerId}
              type="button"
              onClick={() => onSelectBatch(batch)}
              className={`wms-ops-kkd-quick-link text-left transition ${
                selectedBatch?.headerId === batch.headerId ? 'ring-1 ring-[color-mix(in_oklab,var(--wms-ops-accent)_55%,transparent)]' : ''
              }`}
            >
              <div className="flex flex-wrap gap-2 text-sm">
                <MasterDataOpsFlagChip>{batch.excelRecordNo}</MasterDataOpsFlagChip>
                {batch.exportRefNo ? <MasterDataOpsFlagChip tone="info">{batch.exportRefNo}</MasterDataOpsFlagChip> : null}
                <MasterDataOpsFlagChip>{t('steelGoodReceiptAcceptance.inspection.seriesCount', { n: batch.totalSeriesCount })}</MasterDataOpsFlagChip>
                <MasterDataOpsFlagChip tone="warn">{t('steelGoodReceiptAcceptance.inspection.pendingCount', { n: batch.pendingSeriesCount })}</MasterDataOpsFlagChip>
              </div>
              <div className="mt-3 font-medium">{batch.supplierCode} - {batch.supplierName}</div>
              <div className="text-sm opacity-70">{batch.headerDocumentNo ?? t('steelGoodReceiptAcceptance.inspection.noHeaderDoc')}</div>
            </button>
          ))}
        </div>
      ) : hasSearched && !isLoading ? (
        <MasterDataOpsEmptyState className="mt-4">{t('steelGoodReceiptAcceptance.inspection.noHit')}</MasterDataOpsEmptyState>
      ) : null}
    </MasterDataOpsSection>
  );
}
