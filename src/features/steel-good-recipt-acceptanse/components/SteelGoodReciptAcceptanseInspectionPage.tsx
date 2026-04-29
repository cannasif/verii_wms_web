import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPageShell } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SaveSteelGoodReciptAcceptanseInspectionDto,
} from '../types/steel-good-recipt-acceptanse.types';
import { InspectionBatchSearchCard } from './inspection/InspectionBatchSearchCard';
import { InspectionDecisionCard } from './inspection/InspectionDecisionCard';
import { InspectionGuideCard } from './inspection/InspectionGuideCard';
import { InspectionPhotosCard } from './inspection/InspectionPhotosCard';
import { InspectionSeriesListCard } from './inspection/InspectionSeriesListCard';
import {
  buildQuickDecisionForm,
  buildStatusSummary,
  filterDisplayLines,
  type InspectionBatch,
  type InspectionFormState,
  type InspectionLine,
  type SeriesStatusFilter,
} from './inspection/shared';

export function SteelGoodReciptAcceptanseInspectionPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [uniqueValueInput, setUniqueValueInput] = useState('');
  const [uniqueValue, setUniqueValue] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<InspectionBatch | null>(null);
  const [selectedLine, setSelectedLine] = useState<InspectionLine | null>(null);
  const [form, setForm] = useState<InspectionFormState | null>(null);
  const [seriesStatusFilter, setSeriesStatusFilter] = useState<SeriesStatusFilter>('all');

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.inspection.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    setSeriesStatusFilter('all');
  }, [selectedBatch?.headerId]);

  const batchQuery = useQuery({
    queryKey: ['sgra', 'inspection', 'batches', uniqueValue],
    queryFn: () => steelGoodReciptAcceptanseApi.searchInspectionBatches(uniqueValue),
    enabled: uniqueValue.trim().length > 0,
  });

  const detailQuery = useQuery({
    queryKey: ['sgra', 'inspection', 'detail', selectedLine?.id],
    queryFn: () => steelGoodReciptAcceptanseApi.getLineDetail(selectedLine!.id),
    enabled: Boolean(selectedLine?.id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm({
      lineId: detailQuery.data.id,
      isArrived: detailQuery.data.isArrived,
      isApproved: detailQuery.data.isApproved,
      arrivedQuantity: detailQuery.data.arrivedQuantity || detailQuery.data.expectedQuantity,
      approvedQuantity: detailQuery.data.approvedQuantity || 0,
      rejectedQuantity: detailQuery.data.rejectedQuantity || 0,
      rejectReason: detailQuery.data.rejectReason || '',
      note: '',
    });
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error(t('steelGoodReceiptAcceptance.inspection.errForm'));
      return steelGoodReciptAcceptanseApi.saveInspection(form);
    },
    onSuccess: () => {
      toast.success(t('steelGoodReceiptAcceptance.inspection.saveOk'));
      void detailQuery.refetch();
      void batchQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const expectedQuantity = detailQuery.data?.expectedQuantity ?? 0;
  const remainingGap = useMemo(() => {
    if (!form) return 0;
    return Math.max(0, form.arrivedQuantity - (form.approvedQuantity + form.rejectedQuantity));
  }, [form]);

  const textFilteredLines = useMemo(() => {
    if (!selectedBatch) return [];
    const filter = serialFilter.trim().toLowerCase();
    if (!filter) return selectedBatch.lines;
    return selectedBatch.lines.filter((line) =>
      `${line.serialNo} ${line.serialNo2 ?? ''} ${line.stockCode} ${line.dCode}`.toLowerCase().includes(filter));
  }, [selectedBatch, serialFilter]);

  const statusSummary = useMemo(() => {
    return buildStatusSummary(textFilteredLines);
  }, [textFilteredLines]);

  const displayLines = useMemo(() => {
    return filterDisplayLines(textFilteredLines, seriesStatusFilter);
  }, [textFilteredLines, seriesStatusFilter]);

  useEffect(() => {
    if (!selectedLine) {
      return;
    }
    if (!displayLines.some((line) => line.id === selectedLine.id)) {
      setSelectedLine(null);
    }
  }, [displayLines, selectedLine]);

  function updateForm<K extends keyof SaveSteelGoodReciptAcceptanseInspectionDto>(key: K, value: SaveSteelGoodReciptAcceptanseInspectionDto[K]): void {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function applyQuickDecision(type: 'approved' | 'missing' | 'rejected'): void {
    if (!detailQuery.data) return;
    setForm(buildQuickDecisionForm(type, detailQuery.data, {
      quickApproveNote: t('steelGoodReceiptAcceptance.inspection.quickApproveNote'),
      quickMissingNote: t('steelGoodReceiptAcceptance.inspection.quickMissingNote'),
      quickRejectReason: t('steelGoodReceiptAcceptance.inspection.quickRejectReason'),
      quickRejectNote: t('steelGoodReceiptAcceptance.inspection.quickRejectNote'),
    }));
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.inspection.title')}
        description={t('steelGoodReceiptAcceptance.inspection.description')}
      >
        <div className="space-y-6">
          <InspectionGuideCard />

          <InspectionBatchSearchCard
            uniqueValueInput={uniqueValueInput}
            onUniqueValueInputChange={setUniqueValueInput}
            onSearch={() => {
              setUniqueValue(uniqueValueInput.trim());
              setSelectedBatch(null);
              setSelectedLine(null);
              setSerialFilter('');
            }}
            batches={batchQuery.data}
            selectedBatch={selectedBatch}
            onSelectBatch={(batch) => {
              setSelectedBatch(batch);
              setSelectedLine(null);
              setSerialFilter('');
            }}
            hasSearched={Boolean(uniqueValue)}
            isLoading={batchQuery.isLoading}
          />

          {selectedBatch ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-stretch xl:gap-6 xl:h-[calc(100dvh-12rem)] xl:max-h-[calc(100dvh-12rem)] xl:min-h-[280px]">
              <InspectionSeriesListCard
                batch={selectedBatch}
                serialFilter={serialFilter}
                onSerialFilterChange={setSerialFilter}
                seriesStatusFilter={seriesStatusFilter}
                onSeriesStatusFilterChange={setSeriesStatusFilter}
                displayLines={displayLines}
                textFilteredLines={textFilteredLines}
                selectedLine={selectedLine}
                onSelectLine={setSelectedLine}
                statusSummary={statusSummary}
              />

              {detailQuery.data && form ? (
                <div className="flex flex-col gap-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1 custom-scrollbar">
                  <InspectionDecisionCard
                    detail={detailQuery.data}
                    form={form}
                    expectedQuantity={expectedQuantity}
                    remainingGap={remainingGap}
                    onQuickDecision={applyQuickDecision}
                    onUpdateForm={updateForm}
                    onSave={() => void saveMutation.mutateAsync()}
                    isSaving={saveMutation.isPending}
                  />

                  <InspectionPhotosCard
                    lineId={detailQuery.data.id}
                    photos={detailQuery.data.photos}
                    onUploaded={async () => { await detailQuery.refetch(); }}
                    onDeletePhoto={(photoId) => {
                      void steelGoodReciptAcceptanseApi.deleteInspectionPhoto(photoId).then(() => detailQuery.refetch());
                    }}
                  />
                </div>
              ) : (
                <Card className="border-white/10 bg-white/5 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
                  <CardHeader className="shrink-0">
                    <CardTitle>{t('steelGoodReceiptAcceptance.inspection.formTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto custom-scrollbar">
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                      {t('steelGoodReceiptAcceptance.inspection.pickFlowHelp')}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </FormPageShell>
    </div>
  );
}
