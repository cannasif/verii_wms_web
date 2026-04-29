import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  localizeStatus,
  STATUS_CATEGORY_ORDER,
  statusCategoryLabel,
  type StatusCategoryKey,
} from '@/lib/localize-status';
import type { InspectionBatch, InspectionLine, SeriesStatusFilter } from './shared';
import { getStatusTone } from './shared';

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
    <Card className="border-white/10 bg-white/5 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <CardHeader className="shrink-0 space-y-4 border-b border-white/5 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-400/90">
              {t('steelGoodReceiptAcceptance.inspection.seriesStepKicker')}
            </p>
            <CardTitle className="text-xl font-semibold leading-tight tracking-tight">
              {t('steelGoodReceiptAcceptance.inspection.pickSeries')}
            </CardTitle>
            <p className="max-w-xl text-sm text-slate-400">
              {t('steelGoodReceiptAcceptance.inspection.pickSeriesSubtitle')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">{batch.excelRecordNo}</Badge>
            {batch.exportRefNo ? <Badge variant="secondary" className="font-normal">{batch.exportRefNo}</Badge> : null}
            <Badge variant="secondary" className="font-normal">{batch.supplierCode}</Badge>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <Label className="text-slate-300">{t('steelGoodReceiptAcceptance.inspection.seriesFilterLabel')}</Label>
            <span className="text-xs tabular-nums text-slate-500">
              {t('steelGoodReceiptAcceptance.inspection.seriesVisibleCount', {
                n: displayLines.length,
                total: textFilteredLines.length,
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={seriesStatusFilter === 'all' ? 'secondary' : 'outline'}
              className="h-8 rounded-full border-white/15 px-3.5 text-xs font-medium"
              onClick={() => onSeriesStatusFilterChange('all')}
            >
              {t('steelGoodReceiptAcceptance.inspection.seriesFilterAll')}
              <span className="ml-1.5 tabular-nums text-muted-foreground">({textFilteredLines.length})</span>
            </Button>
            {STATUS_CATEGORY_ORDER.map((key) => {
              const count = statusSummary.counts.get(key) ?? 0;
              if (count === 0) {
                return null;
              }
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={seriesStatusFilter === key ? 'secondary' : 'outline'}
                  className="h-8 rounded-full border-white/15 px-3.5 text-xs font-medium"
                  onClick={() => onSeriesStatusFilterChange(key)}
                >
                  {statusCategoryLabel(key, t)}
                  <span className="ml-1.5 tabular-nums text-muted-foreground">({count})</span>
                </Button>
              );
            })}
            {statusSummary.unknown > 0 ? (
              <Button
                type="button"
                size="sm"
                variant={seriesStatusFilter === 'unknown' ? 'secondary' : 'outline'}
                className="h-8 rounded-full border-white/15 px-3.5 text-xs font-medium"
                onClick={() => onSeriesStatusFilterChange('unknown')}
              >
                {t('steelGoodReceiptAcceptance.inspection.seriesFilterOther')}
                <span className="ml-1.5 tabular-nums text-muted-foreground">({statusSummary.unknown})</span>
              </Button>
            ) : null}
          </div>
        </div>
        <Input
          value={serialFilter}
          onChange={(event) => onSerialFilterChange(event.target.value)}
          placeholder={t('steelGoodReceiptAcceptance.inspection.searchPh')}
          className="h-11"
        />
      </CardHeader>
      <CardContent className="custom-scrollbar space-y-3 pt-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1">
        {displayLines.length === 0 && textFilteredLines.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 px-6 py-10 text-center text-sm text-slate-400">
            {t('steelGoodReceiptAcceptance.inspection.seriesEmptyFilter')}
          </div>
        ) : null}
        {displayLines.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelectLine(row)}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              selectedLine?.id === row.id ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{row.dCode}</Badge>
              <Badge variant="secondary">{row.stockCode}</Badge>
              <Badge className={getStatusTone(row.status)}>{localizeStatus(row.status, t)}</Badge>
            </div>
            <div className="mt-2 font-medium">{row.serialNo}</div>
            <div className="text-sm text-slate-400">{row.description}</div>
            <div className="mt-2 text-sm text-slate-300">
              {t('steelGoodReceiptAcceptance.inspection.expQty')}: <span className="font-medium">{row.expectedQuantity}</span>
              {' · '}{t('steelGoodReceiptAcceptance.inspection.approvedQty')}: <span className="font-medium">{row.approvedQuantity}</span>
              {' · '}{t('steelGoodReceiptAcceptance.inspection.rejectedQty')}: <span className="font-medium">{row.rejectedQuantity}</span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
