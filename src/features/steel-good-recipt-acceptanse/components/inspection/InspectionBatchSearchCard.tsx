import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{t('steelGoodReceiptAcceptance.inspection.findBatch')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={uniqueValueInput}
            onChange={(event) => onUniqueValueInputChange(event.target.value)}
            placeholder={t('steelGoodReceiptAcceptance.inspection.batchSearchPh')}
          />
          <Button type="button" variant="outline" onClick={onSearch}>
            {t('steelGoodReceiptAcceptance.inspection.findBatchBtn')}
          </Button>
        </div>

        {batches?.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {batches.map((batch) => (
              <button
                key={batch.headerId}
                type="button"
                onClick={() => onSelectBatch(batch)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedBatch?.headerId === batch.headerId ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{batch.excelRecordNo}</Badge>
                  {batch.exportRefNo ? <Badge variant="secondary">{batch.exportRefNo}</Badge> : null}
                  <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.seriesCount', { n: batch.totalSeriesCount })}</Badge>
                  <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.pendingCount', { n: batch.pendingSeriesCount })}</Badge>
                </div>
                <div className="mt-3 font-medium">{batch.supplierCode} - {batch.supplierName}</div>
                <div className="text-sm text-slate-400">{batch.headerDocumentNo ?? t('steelGoodReceiptAcceptance.inspection.noHeaderDoc')}</div>
              </button>
            ))}
          </div>
        ) : hasSearched && !isLoading ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.inspection.noHit')}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
