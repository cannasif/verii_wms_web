import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTableGrid, type DataTableGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useHangfireDeadLetterPagedQuery, useHangfireFailedPagedQuery, useHangfireStatsQuery } from '../hooks/useHangfireMonitoring';
import type { HangfireJobItemDto } from '../types/hangfireMonitoring.types';

type HangfireColumnKey = 'jobId' | 'jobName' | 'state' | 'time' | 'reason';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'jobId', type: 'string', labelKey: 'table.jobId' },
  { value: 'jobName', type: 'string', labelKey: 'table.jobName' },
  { value: 'state', type: 'string', labelKey: 'table.state' },
  { value: 'reason', type: 'string', labelKey: 'table.reason' },
];

const columns = (t: (key: string, options?: Record<string, unknown>) => string): DataTableGridColumn<HangfireColumnKey>[] => [
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTableGrid<HangfireJobItemDto, HangfireColumnKey>
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
              case 'reason': return <span className="block max-w-[360px] truncate" title={item.reason}>{item.reason || '-'}</span>;
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

  const statsQuery = useHangfireStatsQuery();
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

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: t('common:sidebar.accessControl') }, { label: t('menu'), isActive: true }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>
        <Button variant="outline" onClick={() => void Promise.all([statsQuery.refetch(), failedQuery.refetch(), deadLetterQuery.refetch()])}>
          <RefreshCw size={18} className="mr-2" />
          {t('refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardTitle>{t('stats.enqueued')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{statsQuery.data?.enqueued ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('stats.processing')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{statsQuery.data?.processing ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('stats.succeeded')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-emerald-500">{statsQuery.data?.succeeded ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('stats.failed')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-red-500">{statsQuery.data?.failed ?? 0}</CardContent></Card>
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
