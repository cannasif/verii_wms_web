import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormPageShell } from '@/components/shared';
import {
  localizeStatus,
  resolveStatusCategory,
  statusCategoryLabel,
  STATUS_CATEGORY_ORDER,
  type StatusCategoryKey,
} from '@/lib/localize-status';
import { useUIStore } from '@/stores/ui-store';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type {
  SaveSteelGoodReciptAcceptanseInspectionDto,
  SteelGoodReciptAcceptanseInspectionBatchSearchDto,
  SteelGoodReciptAcceptanseLineListItemDto,
} from '../types/steel-good-recipt-acceptanse.types';
import { SteelGoodReciptAcceptansePhotoUpload } from './SteelGoodReciptAcceptansePhotoUpload';

type SeriesStatusFilter = 'all' | StatusCategoryKey | 'unknown';

function getStatusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('placed') || normalized.includes('placement')) {
    return 'border-violet-400/25 bg-violet-500/10 text-violet-200';
  }
  if (normalized.includes('waiting') || normalized.includes('pending')) {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
  }
  if (normalized.includes('approved')) return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (normalized.includes('rejected')) return 'border-rose-400/20 bg-rose-500/10 text-rose-200';
  if (normalized.includes('arrived')) return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
  return 'border-white/10 bg-white/5 text-slate-200';
}

export function SteelGoodReciptAcceptanseInspectionPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [uniqueValueInput, setUniqueValueInput] = useState('');
  const [uniqueValue, setUniqueValue] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<SteelGoodReciptAcceptanseInspectionBatchSearchDto | null>(null);
  const [selectedLine, setSelectedLine] = useState<SteelGoodReciptAcceptanseLineListItemDto | null>(null);
  const [form, setForm] = useState<SaveSteelGoodReciptAcceptanseInspectionDto | null>(null);
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
    const counts = new Map<StatusCategoryKey, number>();
    let unknown = 0;
    for (const line of textFilteredLines) {
      const category = resolveStatusCategory(line.status);
      if (category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      } else {
        unknown += 1;
      }
    }
    return { counts, unknown };
  }, [textFilteredLines]);

  const displayLines = useMemo(() => {
    if (seriesStatusFilter === 'all') {
      return textFilteredLines;
    }
    if (seriesStatusFilter === 'unknown') {
      return textFilteredLines.filter((line) => resolveStatusCategory(line.status) === null);
    }
    return textFilteredLines.filter((line) => resolveStatusCategory(line.status) === seriesStatusFilter);
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
    if (type === 'approved') {
      setForm({
        lineId: detailQuery.data.id,
        isArrived: true,
        isApproved: true,
        arrivedQuantity: detailQuery.data.expectedQuantity,
        approvedQuantity: detailQuery.data.expectedQuantity,
        rejectedQuantity: 0,
        rejectReason: '',
        note: t('steelGoodReceiptAcceptance.inspection.quickApproveNote'),
      });
      return;
    }

    if (type === 'missing') {
      setForm({
        lineId: detailQuery.data.id,
        isArrived: false,
        isApproved: false,
        arrivedQuantity: 0,
        approvedQuantity: 0,
        rejectedQuantity: 0,
        rejectReason: '',
        note: t('steelGoodReceiptAcceptance.inspection.quickMissingNote'),
      });
      return;
    }

    setForm({
      lineId: detailQuery.data.id,
      isArrived: true,
      isApproved: false,
      arrivedQuantity: detailQuery.data.expectedQuantity,
      approvedQuantity: 0,
      rejectedQuantity: detailQuery.data.expectedQuantity,
      rejectReason: detailQuery.data.rejectReason || t('steelGoodReceiptAcceptance.inspection.quickRejectReason'),
      note: t('steelGoodReceiptAcceptance.inspection.quickRejectNote'),
    });
  }

  return (
    <div className="space-y-6 crm-page">
      <Badge variant="secondary">{t('steelGoodReceiptAcceptance.badge')}</Badge>
      <FormPageShell
        title={t('steelGoodReceiptAcceptance.inspection.title')}
        description={t('steelGoodReceiptAcceptance.inspection.description')}
      >
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>{t('steelGoodReceiptAcceptance.inspection.flowGuideTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
              <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
                <div className="font-medium text-sky-200">{t('steelGoodReceiptAcceptance.inspection.approveTitle')}</div>
                <div>{t('steelGoodReceiptAcceptance.inspection.approveDesc')}</div>
              </div>
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4">
                <div className="font-medium text-rose-200">{t('steelGoodReceiptAcceptance.inspection.rejectTitle')}</div>
                <div>{t('steelGoodReceiptAcceptance.inspection.rejectDesc')}</div>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="font-medium text-amber-200">{t('steelGoodReceiptAcceptance.inspection.partialTitle')}</div>
                <div>{t('steelGoodReceiptAcceptance.inspection.partialDesc')}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>{t('steelGoodReceiptAcceptance.inspection.findBatch')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={uniqueValueInput}
                  onChange={(event) => setUniqueValueInput(event.target.value)}
                  placeholder={t('steelGoodReceiptAcceptance.inspection.batchSearchPh')}
                />
                <Button type="button" variant="outline" onClick={() => {
                  setUniqueValue(uniqueValueInput.trim());
                  setSelectedBatch(null);
                  setSelectedLine(null);
                  setSerialFilter('');
                }}>
                  {t('steelGoodReceiptAcceptance.inspection.findBatchBtn')}
                </Button>
              </div>

              {batchQuery.data?.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {batchQuery.data.map((batch) => (
                    <button
                      key={batch.headerId}
                      type="button"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setSelectedLine(null);
                        setSerialFilter('');
                      }}
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
              ) : uniqueValue && !batchQuery.isLoading ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.inspection.noHit')}</div>
              ) : null}
            </CardContent>
          </Card>

          {selectedBatch ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-stretch xl:gap-6 xl:h-[calc(100dvh-12rem)] xl:max-h-[calc(100dvh-12rem)] xl:min-h-[280px]">
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
                      <Badge variant="secondary" className="font-normal">{selectedBatch.excelRecordNo}</Badge>
                      {selectedBatch.exportRefNo ? <Badge variant="secondary" className="font-normal">{selectedBatch.exportRefNo}</Badge> : null}
                      <Badge variant="secondary" className="font-normal">{selectedBatch.supplierCode}</Badge>
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
                        onClick={() => setSeriesStatusFilter('all')}
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
                            onClick={() => setSeriesStatusFilter(key)}
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
                          onClick={() => setSeriesStatusFilter('unknown')}
                        >
                          {t('steelGoodReceiptAcceptance.inspection.seriesFilterOther')}
                          <span className="ml-1.5 tabular-nums text-muted-foreground">({statusSummary.unknown})</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <Input
                    value={serialFilter}
                    onChange={(event) => setSerialFilter(event.target.value)}
                    placeholder={t('steelGoodReceiptAcceptance.inspection.searchPh')}
                    className="h-11"
                  />
                </CardHeader>
                <CardContent className="space-y-3 pt-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1 custom-scrollbar">
                  {displayLines.length === 0 && textFilteredLines.length > 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 px-6 py-10 text-center text-sm text-slate-400">
                      {t('steelGoodReceiptAcceptance.inspection.seriesEmptyFilter')}
                    </div>
                  ) : null}
                  {displayLines.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedLine(row)}
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

              {detailQuery.data && form ? (
                <div className="flex flex-col gap-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1 custom-scrollbar">
                  <Card className="border-white/10 bg-white/5 shrink-0">
                    <CardHeader>
                      <CardTitle>{t('steelGoodReceiptAcceptance.inspection.formTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.dcode')}</Label><Input value={detailQuery.data.dCode} readOnly /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.stock')}</Label><Input value={detailQuery.data.stockCode} readOnly /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.plate')}</Label><Input value={detailQuery.data.serialNo} readOnly /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.expQty')}</Label><Input value={String(expectedQuantity)} readOnly /></div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('approved')}>
                          {t('steelGoodReceiptAcceptance.inspection.quickApprove')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('missing')}>
                          {t('steelGoodReceiptAcceptance.inspection.quickMissing')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => applyQuickDecision('rejected')}>
                          {t('steelGoodReceiptAcceptance.inspection.quickReject')}
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t('steelGoodReceiptAcceptance.inspection.arrQ')}</Label>
                          <Select value={form.isArrived ? 'yes' : 'no'} onValueChange={(value) => updateForm('isArrived', value === 'yes')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.y')}</SelectItem>
                              <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.n')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('steelGoodReceiptAcceptance.inspection.apprQ')}</Label>
                          <Select value={form.isApproved ? 'yes' : 'no'} onValueChange={(value) => updateForm('isApproved', value === 'yes')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">{t('steelGoodReceiptAcceptance.inspection.yAp')}</SelectItem>
                              <SelectItem value="no">{t('steelGoodReceiptAcceptance.inspection.nAp')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.arrivedQty')}</Label><Input type="number" value={String(form.arrivedQuantity)} onChange={(event) => updateForm('arrivedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.approvedQty')}</Label><Input type="number" value={String(form.approvedQuantity)} onChange={(event) => updateForm('approvedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.rejectedQty')}</Label><Input type="number" value={String(form.rejectedQuantity)} onChange={(event) => updateForm('rejectedQuantity', Number(event.target.value) || 0)} /></div>
                        <div><Label>{t('steelGoodReceiptAcceptance.inspection.statusNote')}</Label><Input value={form.note ?? ''} onChange={(event) => updateForm('note', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.statusNotePh')} /></div>
                      </div>

                      <div><Label>{t('steelGoodReceiptAcceptance.inspection.rejectReasonLabel')}</Label><Input value={form.rejectReason ?? ''} onChange={(event) => updateForm('rejectReason', event.target.value)} placeholder={t('steelGoodReceiptAcceptance.inspection.rejectPh')} /></div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.expQty')}: {expectedQuantity}</Badge>
                        <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.openGap')}: {remainingGap}</Badge>
                        <Badge variant="secondary">{t('steelGoodReceiptAcceptance.inspection.status')}: {localizeStatus(detailQuery.data.status, t)}</Badge>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => void saveMutation.mutateAsync()} disabled={saveMutation.isPending}>
                          {saveMutation.isPending ? t('steelGoodReceiptAcceptance.inspection.saveP') : t('steelGoodReceiptAcceptance.inspection.save')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5 shrink-0">
                    <CardHeader>
                      <CardTitle>{t('steelGoodReceiptAcceptance.inspection.photosTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SteelGoodReciptAcceptansePhotoUpload lineId={detailQuery.data.id} onUploaded={async () => { await detailQuery.refetch(); }} />

                      <div className="space-y-3">
                        {detailQuery.data.photos.map((photo) => (
                          <div key={photo.id} className="flex items-start gap-3 rounded-xl border border-white/10 p-3">
                            <img src={photo.imageUrl} alt={photo.caption ?? photo.id.toString()} className="h-20 w-20 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">{photo.caption || t('steelGoodReceiptAcceptance.inspection.photo')}</div>
                              <div className="text-xs text-slate-400">{photo.createdDate ?? '-'}</div>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => void steelGoodReciptAcceptanseApi.deleteInspectionPhoto(photo.id).then(() => detailQuery.refetch())}>
                              {t('common.delete')}
                            </Button>
                          </div>
                        ))}
                        {detailQuery.data.photos.length === 0 ? (
                          <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{t('steelGoodReceiptAcceptance.inspection.noPhotos')}</div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
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
