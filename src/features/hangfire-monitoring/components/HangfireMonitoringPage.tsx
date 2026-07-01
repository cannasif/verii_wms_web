import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Clock3, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  OpsActionButton,
  OpsListPageShell,
  OpsSelectItem,
  PagedDataGrid,
  type PagedDataGridColumn,
} from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import {
  ADMIN_OPS_PAGE_CLASS,
  AccessControlOpsFormField,
  AccessControlOpsSection,
  AccessControlOpsStatGrid,
} from '@/features/access-control';
import { MasterDataOpsFlagChip, MasterDataOpsSelect, masterDataOpsGridColumn } from '@/features/shared';
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

function HangfireMonitoringOpsEyebrow(): ReactElement {
  const { t } = useTranslation(['hangfire-monitoring', 'access-control']);

  return (
    <>
      <span>{t('sidebar.accessControl', { ns: 'access-control' })}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{t('menu')}</span>
    </>
  );
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
  const tableColumns = useMemo<PagedDataGridColumn<HangfireColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('jobId', t('table.jobId')),
      masterDataOpsGridColumn('jobName', t('table.jobName')),
      masterDataOpsGridColumn('state', t('table.state'), false),
      masterDataOpsGridColumn('time', t('table.time')),
      masterDataOpsGridColumn('reason', t('table.reason'), false),
    ],
    [t],
  );
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
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const visibleColumnKeys = orderedVisibleColumns as HangfireColumnKey[];
  const renderSortIcon = (columnKey: HangfireColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <AccessControlOpsSection title={title} className="mb-6">
      <div className="wms-ops-list wms-ops-form">
        <PagedDataGrid<HangfireJobItemDto, HangfireColumnKey>
          variant="ops"
          columns={tableColumns}
          visibleColumnKeys={visibleColumnKeys}
          rows={rows?.data ?? []}
          rowKey={(row) => row.jobId}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'jobId': return <span className="wms-ops-code-badge">{item.jobId}</span>;
              case 'jobName': return item.jobName;
              case 'state':
                return (
                  <MasterDataOpsFlagChip tone={item.state?.toLowerCase() === 'failed' ? 'warn' : 'default'}>
                    {item.state || '-'}
                  </MasterDataOpsFlagChip>
                );
              case 'time': return <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.failedAt ?? item.enqueuedAt)}</span>;
              case 'reason':
                return (
                  <div className="max-w-[420px]">
                    <span className="block truncate font-medium" title={item.reason}>{item.reason || '-'}</span>
                    {item.technicalReason && item.technicalReason !== item.reason ? (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400" title={item.technicalReason}>{item.technicalReason}</span>
                    ) : null}
                  </div>
                );
              default: return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'state' || columnKey === 'reason') return;
            pagedGrid.handleSort(columnKey);
          }}
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
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          paginationInfoText={paginationInfoText}
          actionBar={{
            variant: 'ops',
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
              ...pagedGrid.searchConfig,
              placeholder: t('common.search'),
              className: 'h-9 w-full md:w-64',
            },
            refresh: {
              onRefresh: refetch,
              isLoading,
              label: t('refresh'),
            },
            leftSlot: (
              <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />
            ),
          }}
        />
      </div>
    </AccessControlOpsSection>
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
  const failedColumnsPref = useColumnPreferences({
    pageKey: 'hangfire-failed-grid',
    columns: [
      { key: 'jobId', label: t('table.jobId') },
      { key: 'jobName', label: t('table.jobName') },
      { key: 'state', label: t('table.state') },
      { key: 'time', label: t('table.time') },
      { key: 'reason', label: t('table.reason') },
    ],
  });
  const deadColumnsPref = useColumnPreferences({
    pageKey: 'hangfire-dead-grid',
    columns: [
      { key: 'jobId', label: t('table.jobId') },
      { key: 'jobName', label: t('table.jobName') },
      { key: 'state', label: t('table.state') },
      { key: 'time', label: t('table.time') },
      { key: 'reason', label: t('table.reason') },
    ],
  });
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
    <OpsListPageShell
      className={ADMIN_OPS_PAGE_CLASS}
      eyebrow={<HangfireMonitoringOpsEyebrow />}
      title={t('title')}
      description={t('description')}
      actions={(
        <OpsActionButton type="button" variant="secondary" onClick={() => void refreshAll()}>
          <RefreshCw size={16} />
          {t('refresh')}
        </OpsActionButton>
      )}
    >
      <AccessControlOpsStatGrid
        className="mb-6 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { label: t('stats.enqueued'), value: statsQuery.data?.enqueued ?? 0 },
          { label: t('stats.processing'), value: statsQuery.data?.processing ?? 0 },
          { label: t('stats.succeeded'), value: statsQuery.data?.succeeded ?? 0 },
          { label: t('stats.failed'), value: statsQuery.data?.failed ?? 0 },
        ]}
      />

      <AccessControlOpsSection
        className="mb-6"
        title={t('manualSync.title')}
        subtitle={t('manualSync.description')}
        actions={(
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => void handleTriggerManualSync()}
            disabled={!selectedJob || isTriggeringSync || selectedJobCooldown > 0}
          >
            <RefreshCw size={16} className={isTriggeringSync ? 'animate-spin' : undefined} />
            {t('manualSync.runButton')}
          </OpsActionButton>
        )}
      >
        <div className="space-y-4">
          <AccessControlOpsFormField label={t('manualSync.selectLabel')}>
            <MasterDataOpsSelect
              value={selectedJobKey}
              onValueChange={setSelectedJobKey}
              placeholder={t('manualSync.selectPlaceholder')}
            >
              {manualJobs.map((job) => (
                <OpsSelectItem key={job.jobKey} value={job.jobKey}>
                  <div className="flex flex-col gap-0.5 py-1">
                    <span className="font-semibold">{job.jobName}</span>
                    <span className="text-xs opacity-70">{job.description || job.jobKey}</span>
                  </div>
                </OpsSelectItem>
              ))}
            </MasterDataOpsSelect>
          </AccessControlOpsFormField>

          <AccessControlOpsStatGrid
            className="md:grid-cols-3"
            items={[
              { label: t('manualSync.lastRun'), value: formatDate(selectedJob?.lastTriggeredAtUtc) },
              { label: t('manualSync.nextAvailable'), value: formatDate(selectedJob?.nextAvailableAtUtc) },
              {
                label: t('manualSync.cooldown'),
                value: (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 opacity-70" aria-hidden />
                    {selectedJobCooldown > 0 ? formatDuration(selectedJobCooldown) : t('manualSync.ready')}
                  </span>
                ),
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            {selectedJob?.category ? (
              <MasterDataOpsFlagChip tone="info">{selectedJob.category}</MasterDataOpsFlagChip>
            ) : null}
            {selectedJobCooldown > 0 ? (
              <MasterDataOpsFlagChip tone="warn">
                {t('manualSync.cooldownActive', { duration: formatDuration(selectedJobCooldown) })}
              </MasterDataOpsFlagChip>
            ) : (
              <MasterDataOpsFlagChip tone="success">{t('manualSync.ready')}</MasterDataOpsFlagChip>
            )}
            <span className="wms-ops-form-hint text-xs">{t('manualSync.cooldownHelp')}</span>
          </div>
          {selectedJob?.description ? (
            <p className="wms-ops-form-hint text-sm leading-6">{selectedJob.description}</p>
          ) : null}
        </div>
      </AccessControlOpsSection>

      {manualJobs.length > 0 ? (
        <section className="wms-ops-receiving-area mb-6 border">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {manualJobs.map((job) => {
              const remaining = job.nextAvailableAtUtc
                ? Math.max(0, Math.ceil((new Date(job.nextAvailableAtUtc).getTime() - Date.now()) / 1000))
                : 0;
              return (
                <div key={job.jobKey} className="wms-ops-stat-card space-y-3 text-left">
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold">{job.jobName}</div>
                    <p className="wms-ops-form-hint text-xs leading-snug">{job.description || job.jobKey}</p>
                  </div>
                  {job.category ? (
                    <MasterDataOpsFlagChip tone="info">{job.category}</MasterDataOpsFlagChip>
                  ) : null}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="wms-ops-form-hint">{t('manualSync.lastRun')}</span>
                      <span className="font-medium">{formatDate(job.lastTriggeredAtUtc)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="wms-ops-form-hint">{t('manualSync.status')}</span>
                      {remaining > 0 ? (
                        <MasterDataOpsFlagChip tone="warn">
                          {t('manualSync.cooldownShort', { duration: formatDuration(remaining) })}
                        </MasterDataOpsFlagChip>
                      ) : (
                        <MasterDataOpsFlagChip tone="success">{t('manualSync.ready')}</MasterDataOpsFlagChip>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <HangfireGrid
        title={t('failed.title')}
        pageKey="hangfire-failed-grid"
        rows={failedQuery.data}
        isLoading={failedQuery.isLoading}
        isError={Boolean(failedQuery.error)}
        errorText={t('common.errors.loadFailed')}
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
        errorText={t('common.errors.loadFailed')}
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
    </OpsListPageShell>
  );
}
