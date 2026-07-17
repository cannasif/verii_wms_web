import { type ReactElement, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseZap, Package, RefreshCcw, Warehouse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { MasterDataOpsErpEyebrow, MasterDataOpsSection, MasterDataOpsStatGrid, masterDataOpsGridColumn } from '@/features/shared';
import { cn } from '@/lib/utils';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { WarehouseBalanceConsistencyIssueDto, WarehouseStockBalanceDto } from '../types/warehouse-balance.types';
import { warehouseBalanceApi } from '../api/warehouse-balance.api';

type StockColumnKey =
  | 'warehouse'
  | 'stock'
  | 'yapKod'
  | 'quantity'
  | 'available'
  | 'serialCount'
  | 'shelfCount'
  | 'updatedAt'
  | 'actions';

type ConsistencyColumnKey =
  | 'issueType'
  | 'warehouse'
  | 'stock'
  | 'yapKod'
  | 'quantityDelta'
  | 'availableDelta'
  | 'serialDelta';

function mapSortBy(value: StockColumnKey): string {
  switch (value) {
    case 'warehouse':
      return 'WarehouseName';
    case 'stock':
      return 'StockCode';
    case 'yapKod':
      return 'YapKodCode';
    case 'quantity':
      return 'Quantity';
    case 'available':
      return 'AvailableQuantity';
    case 'serialCount':
      return 'DistinctSerialCount';
    case 'shelfCount':
      return 'DistinctShelfCount';
    case 'updatedAt':
    default:
      return 'LastRecalculatedAt';
  }
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function renderTruncatedTooltip(text: string | null | undefined, className?: string): ReactElement {
  const value = text?.trim();
  if (!value) {
    return <span className={className}>-</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('block min-w-0 cursor-default truncate', className)}>{value}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4} className="max-w-md whitespace-normal break-words text-left">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

export function WarehouseStockBalancePage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.warehouse-balance');
  const pagedGrid = usePagedDataGrid<StockColumnKey>({
    pageKey: 'warehouse-stock-balance-grid',
    defaultSortBy: 'updatedAt',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpWarehouseStockBalance', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['warehouse-balance', 'stock', pagedGrid.queryParams],
    queryFn: ({ signal }) => warehouseBalanceApi.getStockPaged(pagedGrid.queryParams, { signal }),
  });

  const consistencyGrid = usePagedDataGrid<ConsistencyColumnKey>({
    pageKey: 'warehouse-balance-consistency-grid',
    defaultSortBy: 'warehouse',
    defaultSortDirection: 'asc',
    defaultPageSize: 10,
    mapSortBy: (value) => {
      switch (value) {
        case 'issueType':
          return 'IssueType';
        case 'warehouse':
          return 'WarehouseName';
        case 'stock':
          return 'StockCode';
        case 'yapKod':
          return 'YapKodCode';
        case 'quantityDelta':
          return 'DetailQuantity';
        case 'availableDelta':
          return 'DetailAvailableQuantity';
        case 'serialDelta':
        default:
          return 'DetailDistinctSerialCount';
      }
    },
  });

  const consistencySummaryQuery = useQuery({
    queryKey: ['warehouse-balance', 'consistency-summary'],
    queryFn: ({ signal }) => warehouseBalanceApi.getConsistencySummary({ signal }),
  });

  const consistencyIssuesQuery = useQuery({
    queryKey: ['warehouse-balance', 'consistency-issues', consistencyGrid.queryParams],
    queryFn: ({ signal }) => warehouseBalanceApi.getConsistencyIssuesPaged(consistencyGrid.queryParams, { signal }),
  });

  const rows = useMemo(() => query.data?.data?.data ?? [], [query.data?.data?.data]);
  const range = getPagedRange(query.data?.data);
  const consistencyRows = useMemo(
    () => consistencyIssuesQuery.data?.data?.data ?? [],
    [consistencyIssuesQuery.data?.data?.data],
  );
  const consistencyRange = getPagedRange(consistencyIssuesQuery.data?.data);

  const rebuildAllMutation = useMutation({
    mutationFn: async () => await warehouseBalanceApi.rebuild(),
    onSuccess: async (response) => {
      toast.success(response.message || t('warehouseBalance.stock.toastRebuildAllOk'));
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('warehouseBalance.stock.toastRebuildAllFailed'));
    },
  });

  const rebuildWarehouseMutation = useMutation({
    mutationFn: async (warehouseId: number) => await warehouseBalanceApi.rebuildByWarehouse(warehouseId),
    onSuccess: async (response) => {
      toast.success(response.message || t('warehouseBalance.stock.toastRebuildWarehouseOk'));
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('warehouseBalance.stock.toastRebuildWarehouseFailed'));
    },
  });

  const rebuildStockMutation = useMutation({
    mutationFn: async (stockId: number) => await warehouseBalanceApi.rebuildByStock(stockId),
    onSuccess: async (response) => {
      toast.success(response.message || t('warehouseBalance.stock.toastRebuildStockOk'));
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('warehouseBalance.stock.toastRebuildStockFailed'));
    },
  });

  const columns = useMemo<PagedDataGridColumn<StockColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('warehouse', t('warehouseBalance.stock.columns.warehouse', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('stock', t('warehouseBalance.stock.columns.stock', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('yapKod', t('warehouseBalance.stock.columns.yapKod', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('quantity', t('warehouseBalance.stock.columns.quantity', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('available', t('warehouseBalance.stock.columns.available', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('serialCount', t('warehouseBalance.stock.columns.serialCount', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('shelfCount', t('warehouseBalance.stock.columns.shelfCount', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('updatedAt', t('warehouseBalance.stock.columns.updatedAt', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('actions', t('common.actions'), false),
    ],
    [t],
  );

  const stockFilterColumns = useMemo<FilterColumnConfig[]>(
    () => [
      { value: 'warehouseName', type: 'string', labelKey: 'warehouseBalance.stock.columns.warehouse' },
      { value: 'stockCode', type: 'string', labelKey: 'warehouseBalance.stock.columns.stock' },
      { value: 'stockName', type: 'string', labelKey: 'warehouseBalance.stock.columns.stock' },
      { value: 'yapKodCode', type: 'string', labelKey: 'warehouseBalance.stock.columns.yapKod' },
      { value: 'quantity', type: 'number', labelKey: 'warehouseBalance.stock.columns.quantity' },
      { value: 'availableQuantity', type: 'number', labelKey: 'warehouseBalance.stock.columns.available' },
      { value: 'distinctSerialCount', type: 'number', labelKey: 'warehouseBalance.stock.columns.serialCount' },
      { value: 'distinctShelfCount', type: 'number', labelKey: 'warehouseBalance.stock.columns.shelfCount' },
      { value: 'lastRecalculatedAt', type: 'date', labelKey: 'warehouseBalance.stock.columns.updatedAt' },
    ],
    [],
  );

  const stockExportColumns = useMemo(
    () => columns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({ key: column.key, label: column.label })),
    [columns],
  );

  const stockExportRows = useMemo<Record<string, unknown>[]>(
    () => rows.map((row) => ({
      warehouse: `${row.warehouseCode ?? '-'} - ${row.warehouseName ?? '-'}`,
      stock: `${row.stockCode ?? '-'} - ${row.stockName ?? '-'}`,
      yapKod: row.yapKodCode || row.yapKodName ? `${row.yapKodCode ?? '-'} - ${row.yapKodName ?? '-'}` : '-',
      quantity: row.quantity,
      available: row.availableQuantity,
      serialCount: row.distinctSerialCount,
      shelfCount: row.distinctShelfCount,
      updatedAt: formatDate(row.lastRecalculatedAt ?? row.lastTransactionDate),
    })),
    [rows],
  );

  const totalQuantity = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows]);
  const totalSerials = useMemo(() => rows.reduce((sum, row) => sum + row.distinctSerialCount, 0), [rows]);
  const renderConsistencyIssueType = useCallback((issueType: string): string => {
    switch (issueType) {
      case 'MissingSummary':
        return t('warehouseBalance.consistency.issueTypes.missingSummary', { defaultValue: 'Missing translation' });
      case 'ExtraSummary':
        return t('warehouseBalance.consistency.issueTypes.extraSummary', { defaultValue: 'Missing translation' });
      case 'MetricMismatch':
        return t('warehouseBalance.consistency.issueTypes.metricMismatch', { defaultValue: 'Missing translation' });
      default:
        return issueType;
    }
  }, [t]);

  const consistencyColumns = useMemo<PagedDataGridColumn<ConsistencyColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('issueType', t('warehouseBalance.consistency.columns.issueType', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('warehouse', t('warehouseBalance.consistency.columns.warehouse', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('stock', t('warehouseBalance.consistency.columns.stock', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('yapKod', t('warehouseBalance.consistency.columns.yapKod', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('quantityDelta', t('warehouseBalance.consistency.columns.quantityDelta', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('availableDelta', t('warehouseBalance.consistency.columns.availableDelta', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('serialDelta', t('warehouseBalance.consistency.columns.serialDelta', { defaultValue: 'Missing translation' })),
    ],
    [t],
  );

  const consistencyFilterColumns = useMemo<FilterColumnConfig[]>(
    () => [
      { value: 'issueType', type: 'string', labelKey: 'warehouseBalance.consistency.columns.issueType' },
      { value: 'warehouseName', type: 'string', labelKey: 'warehouseBalance.consistency.columns.warehouse' },
      { value: 'stockCode', type: 'string', labelKey: 'warehouseBalance.consistency.columns.stock' },
      { value: 'stockName', type: 'string', labelKey: 'warehouseBalance.consistency.columns.stock' },
      { value: 'yapKodCode', type: 'string', labelKey: 'warehouseBalance.consistency.columns.yapKod' },
      { value: 'detailQuantity', type: 'number', labelKey: 'warehouseBalance.consistency.columns.quantityDelta' },
      { value: 'detailAvailableQuantity', type: 'number', labelKey: 'warehouseBalance.consistency.columns.availableDelta' },
      { value: 'detailDistinctSerialCount', type: 'number', labelKey: 'warehouseBalance.consistency.columns.serialDelta' },
    ],
    [],
  );

  const consistencyExportColumns = useMemo(
    () => consistencyColumns.map((column) => ({ key: column.key, label: column.label })),
    [consistencyColumns],
  );

  const consistencyExportRows = useMemo<Record<string, unknown>[]>(
    () => consistencyRows.map((row) => ({
      issueType: renderConsistencyIssueType(row.issueType),
      warehouse: `${row.warehouseCode ?? '-'} - ${row.warehouseName ?? '-'}`,
      stock: `${row.stockCode ?? '-'} - ${row.stockName ?? '-'}`,
      yapKod: row.yapKodCode || row.yapKodName ? `${row.yapKodCode ?? '-'} - ${row.yapKodName ?? '-'}` : '-',
      quantityDelta: row.detailQuantity - row.summaryQuantity,
      availableDelta: row.detailAvailableQuantity - row.summaryAvailableQuantity,
      serialDelta: row.detailDistinctSerialCount - row.summaryDistinctSerialCount,
    })),
    [consistencyRows, renderConsistencyIssueType],
  );

  const consistencySummary = consistencySummaryQuery.data?.data;

  const renderQuantityDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailQuantity - row.summaryQuantity);

  const renderAvailableDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailAvailableQuantity - row.summaryAvailableQuantity);

  const renderSerialDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailDistinctSerialCount - row.summaryDistinctSerialCount);

  return (
    <OpsListPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpWarehouseStockBalance')} />}
      title={t('sidebar.erpWarehouseStockBalance')}
      description={t('warehouseBalance.stock.subtitle')}
      actions={
        <div className="flex flex-wrap gap-2">
          <OpsActionButton type="button" variant="secondary" onClick={() => void query.refetch()}>
            <RefreshCcw className="size-3.5" aria-hidden />
            {t('common.refresh')}
          </OpsActionButton>
          {permission.canUpdate ? (
            <OpsActionButton type="button" variant="primary" onClick={() => rebuildAllMutation.mutate()} disabled={rebuildAllMutation.isPending}>
              <DatabaseZap className="size-3.5" aria-hidden />
              {t('warehouseBalance.stock.rebuildAll', { defaultValue: 'Missing translation' })}
            </OpsActionButton>
          ) : null}
        </div>
      }
    >
      <MasterDataOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('warehouseBalance.stock.cards.rows', { defaultValue: 'Missing translation' }), value: query.data?.data?.totalCount ?? 0 },
          { label: t('warehouseBalance.stock.cards.quantity', { defaultValue: 'Missing translation' }), value: formatNumber(totalQuantity) },
          { label: t('warehouseBalance.stock.cards.serials', { defaultValue: 'Missing translation' }), value: formatNumber(totalSerials) },
        ]}
      />

      <section className="wms-ops-receiving-area border">
        <div className="wms-ops-form p-4 sm:p-5">
          <TooltipProvider delayDuration={200}>
          <PagedDataGrid<WarehouseStockBalanceDto, StockColumnKey>
            variant="ops"
            pageKey="warehouse-stock-balance-grid"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'warehouse':
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium">{row.warehouseCode ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.warehouseName ?? '-'}</span>
                    </div>
                  );
                case 'stock':
                  return (
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{row.stockCode ?? '-'}</span>
                      {renderTruncatedTooltip(row.stockName, 'text-xs text-slate-500 dark:text-slate-400')}
                    </div>
                  );
                case 'yapKod':
                  return row.yapKodCode || row.yapKodName
                    ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{row.yapKodCode ?? '-'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.yapKodName ?? '-'}</span>
                      </div>
                    )
                    : '-';
                case 'quantity':
                  return formatNumber(row.quantity);
                case 'available':
                  return formatNumber(row.availableQuantity);
                case 'serialCount':
                  return formatNumber(row.distinctSerialCount);
                case 'shelfCount':
                  return formatNumber(row.distinctShelfCount);
                case 'updatedAt':
                  return formatDate(row.lastRecalculatedAt ?? row.lastTransactionDate);
                case 'actions':
                  return null;
                default:
                  return '-';
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={query.isLoading}
            isError={query.isError}
            errorText={query.error instanceof Error ? query.error.message : t('common.error', { defaultValue: 'Missing translation' })}
            emptyText={t('warehouseBalance.stock.empty', { defaultValue: 'Missing translation' })}
            pageSize={query.data?.data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(query.data?.data)}
            totalPages={query.data?.data?.totalPages ?? 0}
            hasPreviousPage={query.data?.data?.hasPreviousPage ?? false}
            hasNextPage={query.data?.data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous', { defaultValue: 'Missing translation' })}
            nextLabel={t('common.next', { defaultValue: 'Missing translation' })}
            paginationInfoText={t('common.paginationInfo', {
              current: range.from,
              total: range.to,
              totalCount: range.total,
              defaultValue: `${range.from}-${range.to} / ${range.total}`,
            })}
            search={{
              value: pagedGrid.searchConfig.value,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('warehouseBalance.stock.searchPlaceholder', { defaultValue: 'Missing translation' }),
            }}
            refresh={{
              onRefresh: () => void query.refetch(),
              isLoading: query.isLoading,
              label: t('common.refresh'),
            }}
            exportFileName="warehouse-stock-balance"
            exportColumns={stockExportColumns}
            exportRows={stockExportRows}
            filterColumns={stockFilterColumns}
            defaultFilterColumn="warehouseName"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            showActionsColumn={permission.canUpdate}
            actionsHeaderLabel={t('common.actions')}
            actionsCellClassName="wms-ops-table-actions-col"
            iconOnlyActions
            renderActionsCell={(row) => permission.canUpdate ? (
                <div className="wms-ops-row-actions">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="wms-ops-grid-icon-btn"
                        aria-label={t('warehouseBalance.stock.rebuildWarehouse')}
                        onClick={() => rebuildWarehouseMutation.mutate(row.warehouseId)}
                        disabled={rebuildWarehouseMutation.isPending}
                      >
                        <Warehouse className="size-3" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-[14rem] text-center">
                      <p className="font-medium">{t('warehouseBalance.stock.rebuildWarehouse')}</p>
                      <p className="mt-0.5 text-[0.6875rem] opacity-80">
                        {t('warehouseBalance.stock.rebuildWarehouseHint', {
                          defaultValue: 'Recalculates the balance summary for this warehouse row.',
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="wms-ops-grid-icon-btn"
                        aria-label={t('warehouseBalance.stock.rebuildStock')}
                        onClick={() => rebuildStockMutation.mutate(row.stockId)}
                        disabled={rebuildStockMutation.isPending}
                      >
                        <Package className="size-3" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-[14rem] text-center">
                      <p className="font-medium">{t('warehouseBalance.stock.rebuildStock')}</p>
                      <p className="mt-0.5 text-[0.6875rem] opacity-80">
                        {t('warehouseBalance.stock.rebuildStockHint', {
                          defaultValue: 'Recalculates the balance summary for this stock card.',
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
            ) : null}
          />
          </TooltipProvider>
        </div>
      </section>

      <MasterDataOpsSection
        className="mt-6"
        title={t('warehouseBalance.consistency.title', { defaultValue: 'Missing translation' })}
        subtitle={t('warehouseBalance.consistency.description', { defaultValue: 'Missing translation' })}
      >
        <MasterDataOpsStatGrid
          className="mb-4 md:grid-cols-5"
          items={[
            { label: t('warehouseBalance.consistency.cards.summaryRows', { defaultValue: 'Missing translation' }), value: consistencySummary?.summaryRowCount ?? 0 },
            { label: t('warehouseBalance.consistency.cards.detailGroups', { defaultValue: 'Missing translation' }), value: consistencySummary?.detailGroupCount ?? 0 },
            { label: t('warehouseBalance.consistency.cards.mismatch', { defaultValue: 'Missing translation' }), value: consistencySummary?.mismatchCount ?? 0 },
            { label: t('warehouseBalance.consistency.cards.missingSummary', { defaultValue: 'Missing translation' }), value: consistencySummary?.missingSummaryCount ?? 0 },
            { label: t('warehouseBalance.consistency.cards.extraSummary', { defaultValue: 'Missing translation' }), value: consistencySummary?.extraSummaryCount ?? 0 },
          ]}
        />

        <PagedDataGrid<WarehouseBalanceConsistencyIssueDto, ConsistencyColumnKey>
              variant="ops"
              pageKey="warehouse-balance-consistency-grid"
              columns={consistencyColumns}
              rows={consistencyRows}
              rowKey={(row) => `${row.branchCode}-${row.warehouseId}-${row.stockId}-${row.yapKodId ?? 0}-${row.issueType}`}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'issueType':
                    return renderConsistencyIssueType(row.issueType);
                  case 'warehouse':
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium">{row.warehouseCode ?? '-'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.warehouseName ?? '-'}</span>
                      </div>
                    );
                  case 'stock':
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium">{row.stockCode ?? '-'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.stockName ?? '-'}</span>
                      </div>
                    );
                  case 'yapKod':
                    return row.yapKodCode || row.yapKodName
                      ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{row.yapKodCode ?? '-'}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{row.yapKodName ?? '-'}</span>
                        </div>
                      )
                      : '-';
                  case 'quantityDelta':
                    return renderQuantityDelta(row);
                  case 'availableDelta':
                    return renderAvailableDelta(row);
                  case 'serialDelta':
                    return renderSerialDelta(row);
                  default:
                    return '-';
                }
              }}
              sortBy={consistencyGrid.sortBy}
              sortDirection={consistencyGrid.sortDirection}
              onSort={consistencyGrid.handleSort}
              isLoading={consistencyIssuesQuery.isLoading || consistencySummaryQuery.isLoading}
              isError={consistencyIssuesQuery.isError || consistencySummaryQuery.isError}
              errorText={(consistencyIssuesQuery.error instanceof Error ? consistencyIssuesQuery.error.message : undefined) ?? (consistencySummaryQuery.error instanceof Error ? consistencySummaryQuery.error.message : t('common.error', { defaultValue: 'Missing translation' }))}
              emptyText={t('warehouseBalance.consistency.empty', { defaultValue: 'Missing translation' })}
              pageSize={consistencyIssuesQuery.data?.data?.pageSize ?? consistencyGrid.pageSize}
              pageSizeOptions={consistencyGrid.pageSizeOptions}
              onPageSizeChange={consistencyGrid.handlePageSizeChange}
              pageNumber={consistencyGrid.getDisplayPageNumber(consistencyIssuesQuery.data?.data)}
              totalPages={consistencyIssuesQuery.data?.data?.totalPages ?? 0}
              hasPreviousPage={consistencyIssuesQuery.data?.data?.hasPreviousPage ?? false}
              hasNextPage={consistencyIssuesQuery.data?.data?.hasNextPage ?? false}
              onPreviousPage={consistencyGrid.goToPreviousPage}
              onNextPage={consistencyGrid.goToNextPage}
              previousLabel={t('common.previous', { defaultValue: 'Missing translation' })}
              nextLabel={t('common.next', { defaultValue: 'Missing translation' })}
              paginationInfoText={t('common.paginationInfo', {
                current: consistencyRange.from,
                total: consistencyRange.to,
                totalCount: consistencyRange.total,
                defaultValue: `${consistencyRange.from}-${consistencyRange.to} / ${consistencyRange.total}`,
              })}
              search={{
                value: consistencyGrid.searchConfig.value,
                onValueChange: consistencyGrid.searchConfig.onValueChange,
                onSearchChange: consistencyGrid.searchConfig.onSearchChange,
                placeholder: t('warehouseBalance.consistency.searchPlaceholder', { defaultValue: 'Missing translation' }),
              }}
              refresh={{
                onRefresh: () => void consistencyIssuesQuery.refetch(),
                isLoading: consistencyIssuesQuery.isLoading,
                label: t('common.refresh'),
              }}
              exportFileName="warehouse-balance-consistency"
              exportColumns={consistencyExportColumns}
              exportRows={consistencyExportRows}
              filterColumns={consistencyFilterColumns}
              defaultFilterColumn="issueType"
              draftFilterRows={consistencyGrid.draftFilterRows}
              onDraftFilterRowsChange={consistencyGrid.setDraftFilterRows}
              filterLogic={consistencyGrid.filterLogic}
              onFilterLogicChange={consistencyGrid.setFilterLogic}
              onApplyFilters={consistencyGrid.applyAdvancedFilters}
              onClearFilters={consistencyGrid.clearAdvancedFilters}
              appliedFilterCount={consistencyGrid.appliedAdvancedFilters.length}
            />
      </MasterDataOpsSection>
    </OpsListPageShell>
  );
}
