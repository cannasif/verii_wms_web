import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Clock3, Play, RefreshCw, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { hangfireMonitoringApi } from '../api/hangfireMonitoring.api';
import {
  useHangfireDeadLetterPagedQuery,
  useHangfireFailedPagedQuery,
  useHangfireManualSyncJobsQuery,
  useHangfireStatsQuery,
} from '../hooks/useHangfireMonitoring';
import type { HangfireJobItemDto } from '../types/hangfireMonitoring.types';

type HangfireColumnKey = 'jobId' | 'jobName' | 'state' | 'time' | 'reason';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'jobId', type: 'string', labelKey: 'table.jobId' },
  { value: 'jobName', type: 'string', labelKey: 'table.jobName' },
  { value: 'state', type: 'string', labelKey: 'table.state' },
  { value: 'reason', type: 'string', labelKey: 'table.reason' },
];

const columns = (t: (key: string, options?: Record<string, unknown>) => string): PagedDataGridColumn<HangfireColumnKey>[] => [
  { key: 'jobId', label: t('table.jobId') },
  { key: 'jobName', label: t('table.jobName') },
  { key: 'state', label: t('table.state') },
  { key: 'time', label: t('table.time') },
  { key: 'reason', label: t('table.reason') },
];

function mapSortBy(value: HangfireColumnKey): string {
  switch (value) {
    case 'jobName': return 'jobName';
    case 'state': return 'state';
    case 'time': return 'time';
    case 'reason': return 'reason';
    case 'jobId':
    default: return 'jobId';
  }
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function HangfireGrid({
  title,
  pageKey,
  rows,
  isLoading,
  isError,
  errorText,
  emptyText,
  pagedGrid,
  userId,
  visibleColumns,
  columnOrder,
  orderedVisibleColumns,
  setVisibleColumns,
  setColumnOrder,
  refetch,
}: {
  title: string;
  pageKey: string;
  rows: import('@/types/api').PagedResponse<HangfireJobItemDto> | undefined;
  isLoading: boolean;
  isError: boolean;
  errorText: string;
  emptyText: string;
  pagedGrid: ReturnType<typeof usePagedDataGrid<HangfireColumnKey>>;
  userId?: number;
  visibleColumns: string[];
  columnOrder: string[];
  orderedVisibleColumns: string[];
  setVisibleColumns: (visible: string[]) => void;
  setColumnOrder: (order: string[]) => void;
  refetch: () => void;
}): ReactElement {
  const { t } = useTranslation(['hangfire-monitoring', 'common']);
  const tableColumns = useMemo(() => columns((key, options) => t(key, options)), [t]);
  const exportColumns = useMemo(
    () => orderedVisibleColumns.map((key) => ({ key, label: tableColumns.find((column) => column.key === key)?.label ?? key })),
    [orderedVisibleColumns, tableColumns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => (rows?.data ?? []).map((item) => ({
    jobId: item.jobId,
    jobName: item.jobName,
    state: item.state,
    time: formatDate(item.failedAt ?? item.enqueuedAt),
    reason: item.reason || '-',
  })), [rows?.data]);
  const range = getPagedRange(rows);
  const paginationInfoText = t('common:common.paginationInfo', { current: range.from, total: range.to, count: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const visibleColumnKeys = orderedVisibleColumns as HangfireColumnKey[];
  const renderSortIcon = (columnKey: HangfireColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <PagedDataGrid<HangfireJobItemDto, HangfireColumnKey>
          columns={tableColumns}
          visibleColumnKeys={visibleColumnKeys}
          rows={rows?.data ?? []}
          rowKey={(row) => row.jobId}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'jobId': return <span className="font-mono text-xs">{item.jobId}</span>;
              case 'jobName': return item.jobName;
              case 'state': return <Badge variant={item.state?.toLowerCase() === 'failed' ? 'destructive' : 'secondary'}>{item.state || '-'}</Badge>;
              case 'time': return formatDate(item.failedAt ?? item.enqueuedAt);
              case 'reason':
                return (
                  <div className="max-w-[420px]">
                    <span className="block truncate font-medium text-slate-900" title={item.reason}>{item.reason || '-'}</span>
                    {item.technicalReason && item.technicalReason !== item.reason ? (
                      <span className="block truncate text-xs text-slate-500" title={item.technicalReason}>{item.technicalReason}</span>
                    ) : null}
                  </div>
                );
              default: return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={pagedGrid.handleSort}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={isError}
          errorText={errorText}
          emptyText={emptyText}
          pageSize={rows?.pageSize ?? pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(rows)}
          totalPages={Math.max(rows?.totalPages ?? 1, 1)}
          hasPreviousPage={Boolean(rows?.hasPreviousPage)}
          hasNextPage={Boolean(rows?.hasNextPage)}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common:common.previous')}
          nextLabel={t('common:common.next')}
          paginationInfoText={paginationInfoText}
          actionBar={{
            pageKey,
            userId,
            columns: tableColumns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: pageKey,
            exportColumns,
            exportRows,
            filterColumns,
            defaultFilterColumn: 'jobId',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('common:common.search'),
            },
            refresh: {
              onRefresh: refetch,
              isLoading,
              label: t('refresh'),
            },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          }}
        />
      </CardContent>
    </Card>
  );
}

export function HangfireMonitoringPage(): ReactElement {
  const { t } = useTranslation(['hangfire-monitoring', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedJobKey, setSelectedJobKey] = useState<string>('');
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);
  const [, forceTick] = useState(0);

  const statsQuery = useHangfireStatsQuery();
  const manualJobsQuery = useHangfireManualSyncJobsQuery();
  const failedGrid = usePagedDataGrid<HangfireColumnKey>({ pageKey: 'hangfire-failed-grid', defaultSortBy: 'jobId', defaultSortDirection: 'desc', defaultPageSize: 20, mapSortBy });
  const deadGrid = usePagedDataGrid<HangfireColumnKey>({ pageKey: 'hangfire-dead-grid', defaultSortBy: 'jobId', defaultSortDirection: 'desc', defaultPageSize: 20, mapSortBy });
  const failedColumnsPref = useColumnPreferences({ pageKey: 'hangfire-failed-grid', columns: columns((key) => t(key)) });
  const deadColumnsPref = useColumnPreferences({ pageKey: 'hangfire-dead-grid', columns: columns((key) => t(key)) });
  const failedQuery = useHangfireFailedPagedQuery(failedGrid.queryParams);
  const deadLetterQuery = useHangfireDeadLetterPagedQuery(deadGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    const timer = window.setInterval(() => forceTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const manualJobs = useMemo(() => {
    const statsJobs = statsQuery.data?.manualSyncJobs ?? [];
    return manualJobsQuery.data?.length ? manualJobsQuery.data : statsJobs;
  }, [manualJobsQuery.data, statsQuery.data?.manualSyncJobs]);

  useEffect(() => {
    if (!selectedJobKey && manualJobs.length > 0) {
      setSelectedJobKey(manualJobs[0].jobKey);
    }
  }, [manualJobs, selectedJobKey]);

  const selectedJob = useMemo(() => manualJobs.find((job) => job.jobKey === selectedJobKey) ?? null, [manualJobs, selectedJobKey]);
  const selectedJobCooldown = useMemo(() => {
    if (!selectedJob?.nextAvailableAtUtc) return 0;
    const remainingMs = new Date(selectedJob.nextAvailableAtUtc).getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }, [selectedJob?.nextAvailableAtUtc]);

  const refreshAll = async (): Promise<void> => {
    await Promise.all([
      statsQuery.refetch(),
      manualJobsQuery.refetch(),
      failedQuery.refetch(),
      deadLetterQuery.refetch(),
    ]);
  };

  const handleTriggerManualSync = async (): Promise<void> => {
    if (!selectedJobKey) return;
    try {
      setIsTriggeringSync(true);
      const result = await hangfireMonitoringApi.triggerManualSync(selectedJobKey);
      toast.success(t('manualSync.success', {
        defaultValue: `${result.jobName} kuyruğa alındı. JobId: ${result.jobId}`,
        jobName: result.jobName,
        jobId: result.jobId,
      }));
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('manualSync.error'));
      await manualJobsQuery.refetch();
    } finally {
      setIsTriggeringSync(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: t('common:sidebar.accessControl') }, { label: t('menu'), isActive: true }]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <Activity className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">{t('description')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void refreshAll()}>
          <RefreshCw size={18} className="mr-2" />
          {t('refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#0f3d70_55%,#0ea5e9_100%)] text-white shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Play className="h-5 w-5" />
              {t('manualSync.title')}
            </CardTitle>
            <CardDescription className="text-sky-100">{t('manualSync.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-sky-50">{t('manualSync.selectLabel')}</label>
                <Select value={selectedJobKey} onValueChange={setSelectedJobKey}>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15">
                    <SelectValue placeholder={t('manualSync.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {manualJobs.map((job) => (
                      <SelectItem key={job.jobKey} value={job.jobKey}>
                        {job.jobName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={handleTriggerManualSync}
                disabled={!selectedJob || isTriggeringSync || selectedJobCooldown > 0}
              >
                <RefreshCw size={18} className={`mr-2 ${isTriggeringSync ? 'animate-spin' : ''}`} />
                {t('manualSync.runButton')}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">{t('manualSync.lastRun')}</div>
                <div className="mt-2 text-sm font-medium text-white">{formatDate(selectedJob?.lastTriggeredAtUtc)}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">{t('manualSync.nextAvailable')}</div>
                <div className="mt-2 text-sm font-medium text-white">{formatDate(selectedJob?.nextAvailableAtUtc)}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">{t('manualSync.cooldown')}</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock3 className="h-4 w-4 text-sky-200" />
                  {selectedJobCooldown > 0 ? formatDuration(selectedJobCooldown) : t('manualSync.ready')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedJobCooldown > 0 ? (
                <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-700">
                  {t('manualSync.cooldownActive', { duration: formatDuration(selectedJobCooldown) })}
                </Badge>
              ) : (
                <Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {t('manualSync.ready')}
                </Badge>
              )}
              <span className="text-xs text-sky-100">{t('manualSync.cooldownHelp')}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">{t('stats.enqueued')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">{statsQuery.data?.enqueued ?? 0}</CardContent>
          </Card>
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">{t('stats.processing')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">{statsQuery.data?.processing ?? 0}</CardContent>
          </Card>
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">{t('stats.succeeded')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-emerald-600">{statsQuery.data?.succeeded ?? 0}</CardContent>
          </Card>
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                {t('stats.failed')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-red-600">{statsQuery.data?.failed ?? 0}</CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {manualJobs.map((job) => {
          const remaining = job.nextAvailableAtUtc
            ? Math.max(0, Math.ceil((new Date(job.nextAvailableAtUtc).getTime() - Date.now()) / 1000))
            : 0;
          return (
            <Card key={job.jobKey} className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{job.jobName}</CardTitle>
                <CardDescription>{job.jobKey}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t('manualSync.lastRun')}</span>
                  <span className="font-medium text-slate-900">{formatDate(job.lastTriggeredAtUtc)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t('manualSync.status')}</span>
                  {remaining > 0 ? (
                    <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-700">
                      {t('manualSync.cooldownShort', { duration: formatDuration(remaining) })}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {t('manualSync.ready')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <HangfireGrid
        title={t('failed.title')}
        pageKey="hangfire-failed-grid"
        rows={failedQuery.data}
        isLoading={failedQuery.isLoading}
        isError={Boolean(failedQuery.error)}
        errorText={t('common:common.errors.loadFailed')}
        emptyText={t('failed.empty')}
        pagedGrid={failedGrid}
        userId={failedColumnsPref.userId}
        visibleColumns={failedColumnsPref.visibleColumns}
        columnOrder={failedColumnsPref.columnOrder}
        orderedVisibleColumns={failedColumnsPref.orderedVisibleColumns}
        setVisibleColumns={failedColumnsPref.setVisibleColumns}
        setColumnOrder={failedColumnsPref.setColumnOrder}
        refetch={() => void failedQuery.refetch()}
      />

      <HangfireGrid
        title={t('deadLetter.title')}
        pageKey="hangfire-dead-grid"
        rows={deadLetterQuery.data}
        isLoading={deadLetterQuery.isLoading}
        isError={Boolean(deadLetterQuery.error)}
        errorText={t('common:common.errors.loadFailed')}
        emptyText={t('deadLetter.empty')}
        pagedGrid={deadGrid}
        userId={deadColumnsPref.userId}
        visibleColumns={deadColumnsPref.visibleColumns}
        columnOrder={deadColumnsPref.columnOrder}
        orderedVisibleColumns={deadColumnsPref.orderedVisibleColumns}
        setVisibleColumns={deadColumnsPref.setVisibleColumns}
        setColumnOrder={deadColumnsPref.setColumnOrder}
        refetch={() => void deadLetterQuery.refetch()}
      />
    </div>
  );
}
