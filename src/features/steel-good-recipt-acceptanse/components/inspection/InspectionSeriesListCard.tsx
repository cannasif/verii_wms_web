import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsInput } from '@/components/shared';
import {
  MasterDataOpsEmptyState,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
} from '@/features/shared';
import {
  localizeStatus,
  STATUS_CATEGORY_ORDER,
  statusCategoryLabel,
  type StatusCategoryKey,
} from '@/lib/localize-status';
import type { InspectionBatch, InspectionLine, SeriesStatusFilter } from './shared';

interface InspectionSeriesListCardProps {
  batch: InspectionBatch;
  serialFilter: string;
  onSerialFilterChange: (value: string) => void;
  seriesStatusFilter: SeriesStatusFilter;
  onSeriesStatusFilterChange: (value: SeriesStatusFilter) => void;
  displayLines: InspectionLine[];
  textFilteredLines: InspectionLine[];
  selectedLine: InspectionLine | null;
  onSelectLine: (line: InspectionLine) => void;
  statusSummary: {
    counts: Map<StatusCategoryKey, number>;
    unknown: number;
  };
}

export function InspectionSeriesListCard({
  batch,
  serialFilter,
  onSerialFilterChange,
  seriesStatusFilter,
  onSeriesStatusFilterChange,
  displayLines,
  textFilteredLines,
  selectedLine,
  onSelectLine,
  statusSummary,
}: InspectionSeriesListCardProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <MasterDataOpsSection
      className="xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden"
      title={t('steelGoodReceiptAcceptance.inspection.pickSeries')}
      subtitle={t('steelGoodReceiptAcceptance.inspection.pickSeriesSubtitle')}
      actions={
        <div className="flex flex-wrap gap-2">
          <MasterDataOpsFlagChip>{batch.excelRecordNo}</MasterDataOpsFlagChip>
          {batch.exportRefNo ? <MasterDataOpsFlagChip tone="info">{batch.exportRefNo}</MasterDataOpsFlagChip> : null}
          <MasterDataOpsFlagChip>{batch.supplierCode}</MasterDataOpsFlagChip>
        </div>
      }
    >
      <div className="space-y-3 border-b border-[color-mix(in_oklab,var(--wms-ops-accent)_12%,var(--wms-ops-card-border))] pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="wms-ops-prelabel-form-label">{t('steelGoodReceiptAcceptance.inspection.seriesFilterLabel')}</span>
          <span className="text-xs tabular-nums opacity-60">
            {t('steelGoodReceiptAcceptance.inspection.seriesVisibleCount', {
              n: displayLines.length,
              total: textFilteredLines.length,
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <OpsActionButton
            type="button"
            variant={seriesStatusFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => onSeriesStatusFilterChange('all')}
          >
            {t('steelGoodReceiptAcceptance.inspection.seriesFilterAll')} ({textFilteredLines.length})
          </OpsActionButton>
          {STATUS_CATEGORY_ORDER.map((key) => {
            const count = statusSummary.counts.get(key) ?? 0;
            if (count === 0) return null;
            return (
              <OpsActionButton
                key={key}
                type="button"
                variant={seriesStatusFilter === key ? 'primary' : 'secondary'}
                onClick={() => onSeriesStatusFilterChange(key)}
              >
                {statusCategoryLabel(key, t)} ({count})
              </OpsActionButton>
            );
          })}
          {statusSummary.unknown > 0 ? (
            <OpsActionButton
              type="button"
              variant={seriesStatusFilter === 'unknown' ? 'primary' : 'secondary'}
              onClick={() => onSeriesStatusFilterChange('unknown')}
            >
              {t('steelGoodReceiptAcceptance.inspection.seriesFilterOther')} ({statusSummary.unknown})
            </OpsActionButton>
          ) : null}
        </div>
        <MasterDataOpsFormField label={t('steelGoodReceiptAcceptance.inspection.searchPh')}>
          <OpsInput
            value={serialFilter}
            onChange={(event) => onSerialFilterChange(event.target.value)}
            placeholder={t('steelGoodReceiptAcceptance.inspection.searchPh')}
          />
        </MasterDataOpsFormField>
      </div>

      <div className="custom-scrollbar mt-4 space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1">
        {displayLines.length === 0 && textFilteredLines.length > 0 ? (
          <MasterDataOpsEmptyState>{t('steelGoodReceiptAcceptance.inspection.seriesEmptyFilter')}</MasterDataOpsEmptyState>
        ) : null}
        {displayLines.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelectLine(row)}
            className={`wms-ops-kkd-quick-link w-full text-left transition ${
              selectedLine?.id === row.id ? 'ring-1 ring-[color-mix(in_oklab,var(--wms-ops-accent)_55%,transparent)]' : ''
            }`}
          >
            <div className="flex flex-wrap gap-2 text-sm">
              <MasterDataOpsFlagChip>{row.dCode}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone="info">{row.stockCode}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip>{localizeStatus(row.status, t)}</MasterDataOpsFlagChip>
            </div>
            <div className="mt-2 font-medium">{row.serialNo}</div>
            <div className="text-sm opacity-70">{row.description}</div>
            <div className="mt-2 text-sm">
              {t('steelGoodReceiptAcceptance.inspection.expQty')}: <span className="font-medium">{row.expectedQuantity}</span>
              {' · '}{t('steelGoodReceiptAcceptance.inspection.approvedQty')}: <span className="font-medium">{row.approvedQuantity}</span>
              {' · '}{t('steelGoodReceiptAcceptance.inspection.rejectedQty')}: <span className="font-medium">{row.rejectedQuantity}</span>
            </div>
          </button>
        ))}
      </div>
    </MasterDataOpsSection>
  );
}
