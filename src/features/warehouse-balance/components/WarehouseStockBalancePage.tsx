import { type ReactElement, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, DatabaseZap, RefreshCcw, Rows3, ScanSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
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
    setPageTitle(t('sidebar.erpWarehouseStockBalance', { defaultValue: 'Depo Stok Bakiyesi' }));
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

  const rows = query.data?.data?.data ?? [];
  const range = getPagedRange(query.data?.data);
  const consistencyRows = consistencyIssuesQuery.data?.data?.data ?? [];
  const consistencyRange = getPagedRange(consistencyIssuesQuery.data?.data);

  const rebuildAllMutation = useMutation({
    mutationFn: async () => await warehouseBalanceApi.rebuild(),
    onSuccess: async (response) => {
      toast.success(response.message || 'Depo stok bakiyesi yeniden olusturuldu');
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Depo stok bakiyesi yeniden olusturulamadi');
    },
  });

  const rebuildWarehouseMutation = useMutation({
    mutationFn: async (warehouseId: number) => await warehouseBalanceApi.rebuildByWarehouse(warehouseId),
    onSuccess: async (response) => {
      toast.success(response.message || 'Depo bazli bakiye yeniden olusturuldu');
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Depo bazli bakiye yeniden olusturulamadi');
    },
  });

  const rebuildStockMutation = useMutation({
    mutationFn: async (stockId: number) => await warehouseBalanceApi.rebuildByStock(stockId),
    onSuccess: async (response) => {
      toast.success(response.message || 'Stok bazli bakiye yeniden olusturuldu');
      await queryClient.invalidateQueries({ queryKey: ['warehouse-balance'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Stok bazli bakiye yeniden olusturulamadi');
    },
  });

  const columns = useMemo<PagedDataGridColumn<StockColumnKey>[]>(
    () => [
      { key: 'warehouse', label: t('warehouseBalance.stock.columns.warehouse', { defaultValue: 'Depo' }) },
      { key: 'stock', label: t('warehouseBalance.stock.columns.stock', { defaultValue: 'Stok' }) },
      { key: 'yapKod', label: t('warehouseBalance.stock.columns.yapKod', { defaultValue: 'YapKod' }) },
      { key: 'quantity', label: t('warehouseBalance.stock.columns.quantity', { defaultValue: 'Miktar' }) },
      { key: 'available', label: t('warehouseBalance.stock.columns.available', { defaultValue: 'Kullanilabilir' }) },
      { key: 'serialCount', label: t('warehouseBalance.stock.columns.serialCount', { defaultValue: 'Seri Sayisi' }) },
      { key: 'shelfCount', label: t('warehouseBalance.stock.columns.shelfCount', { defaultValue: 'Raf Sayisi' }) },
      { key: 'updatedAt', label: t('warehouseBalance.stock.columns.updatedAt', { defaultValue: 'Son Hesaplama' }) },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

  const totalQuantity = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows]);
  const totalSerials = useMemo(() => rows.reduce((sum, row) => sum + row.distinctSerialCount, 0), [rows]);
  const consistencyColumns = useMemo<PagedDataGridColumn<ConsistencyColumnKey>[]>(
    () => [
      { key: 'issueType', label: t('warehouseBalance.consistency.columns.issueType', { defaultValue: 'Sorun Tipi' }) },
      { key: 'warehouse', label: t('warehouseBalance.consistency.columns.warehouse', { defaultValue: 'Depo' }) },
      { key: 'stock', label: t('warehouseBalance.consistency.columns.stock', { defaultValue: 'Stok' }) },
      { key: 'yapKod', label: t('warehouseBalance.consistency.columns.yapKod', { defaultValue: 'YapKod' }) },
      { key: 'quantityDelta', label: t('warehouseBalance.consistency.columns.quantityDelta', { defaultValue: 'Miktar Farki' }) },
      { key: 'availableDelta', label: t('warehouseBalance.consistency.columns.availableDelta', { defaultValue: 'Kullanilabilir Farki' }) },
      { key: 'serialDelta', label: t('warehouseBalance.consistency.columns.serialDelta', { defaultValue: 'Seri Farki' }) },
    ],
    [t],
  );

  const consistencySummary = consistencySummaryQuery.data?.data;

  const renderConsistencyIssueType = (issueType: string): string => {
    switch (issueType) {
      case 'MissingSummary':
        return t('warehouseBalance.consistency.issueTypes.missingSummary', { defaultValue: 'Summary Eksik' });
      case 'ExtraSummary':
        return t('warehouseBalance.consistency.issueTypes.extraSummary', { defaultValue: 'Fazla Summary' });
      case 'MetricMismatch':
        return t('warehouseBalance.consistency.issueTypes.metricMismatch', { defaultValue: 'Deger Uyusmazligi' });
      default:
        return issueType;
    }
  };

  const renderQuantityDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailQuantity - row.summaryQuantity);

  const renderAvailableDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailAvailableQuantity - row.summaryAvailableQuantity);

  const renderSerialDelta = (row: WarehouseBalanceConsistencyIssueDto): string =>
    formatNumber(row.detailDistinctSerialCount - row.summaryDistinctSerialCount);

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'ERP' }) },
          { label: t('sidebar.erpWarehouseStockBalance', { defaultValue: 'Depo Stok Bakiyesi' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">WarehouseBalance</Badge>
              <Badge variant="secondary">Summary</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {t('sidebar.erpWarehouseStockBalance', { defaultValue: 'Depo Stok Bakiyesi' })}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Depo bazli kümüle stok, yapkod, seri sayisi ve raf yayilimini tek ekranda izleyin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void query.refetch()}>
              <RefreshCcw className="mr-2 size-4" />
              {t('common.refresh')}
            </Button>
            {permission.canUpdate ? (
              <Button onClick={() => rebuildAllMutation.mutate()} disabled={rebuildAllMutation.isPending}>
                <DatabaseZap className="mr-2 size-4" />
                {t('warehouseBalance.stock.rebuildAll', { defaultValue: 'Tum Ozeti Rebuild Et' })}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <Rows3 className="size-5 text-sky-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.stock.cards.rows', { defaultValue: 'Kayit' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{query.data?.data?.totalCount ?? 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <ScanSearch className="size-5 text-emerald-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.stock.cards.quantity', { defaultValue: 'Toplam Miktar' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(totalQuantity)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <DatabaseZap className="size-5 text-fuchsia-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.stock.cards.serials', { defaultValue: 'Gorunen Seri Sayisi' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(totalSerials)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
        <CardContent className="p-5">
          <PagedDataGrid<WarehouseStockBalanceDto, StockColumnKey>
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
            errorText={query.error instanceof Error ? query.error.message : t('common.error', { defaultValue: 'Bir hata olustu' })}
            emptyText={t('warehouseBalance.stock.empty', { defaultValue: 'Depo stok bakiye kaydi bulunamadi' })}
            pageSize={query.data?.data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(query.data?.data)}
            totalPages={query.data?.data?.totalPages ?? 0}
            hasPreviousPage={query.data?.data?.hasPreviousPage ?? false}
            hasNextPage={query.data?.data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous', { defaultValue: 'Onceki' })}
            nextLabel={t('common.next', { defaultValue: 'Sonraki' })}
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
              placeholder: t('warehouseBalance.stock.searchPlaceholder', { defaultValue: 'Depo, stok veya yapkod ara...' }),
            }}
            showActionsColumn={permission.canUpdate}
            actionsHeaderLabel={t('common.actions')}
            renderActionsCell={(row) => permission.canUpdate ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rebuildWarehouseMutation.mutate(row.warehouseId)}
                  disabled={rebuildWarehouseMutation.isPending}
                >
                  {t('warehouseBalance.stock.rebuildWarehouse', { defaultValue: 'Depoyu Rebuild Et' })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rebuildStockMutation.mutate(row.stockId)}
                  disabled={rebuildStockMutation.isPending}
                >
                  {t('warehouseBalance.stock.rebuildStock', { defaultValue: 'Stogu Rebuild Et' })}
                </Button>
              </div>
            ) : null}
          />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              {t('warehouseBalance.consistency.title', { defaultValue: 'Bakiye Tutarlilik Kontrolu' })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('warehouseBalance.consistency.description', { defaultValue: 'Detail ve summary bakiye arasindaki farklari izleyin.' })}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]"><CardContent className="p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.consistency.cards.summaryRows', { defaultValue: 'Summary Satir' })}</div><div className="mt-2 text-2xl font-semibold">{consistencySummary?.summaryRowCount ?? 0}</div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]"><CardContent className="p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.consistency.cards.detailGroups', { defaultValue: 'Detail Grup' })}</div><div className="mt-2 text-2xl font-semibold">{consistencySummary?.detailGroupCount ?? 0}</div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]"><CardContent className="p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.consistency.cards.mismatch', { defaultValue: 'Toplam Sorun' })}</div><div className="mt-2 text-2xl font-semibold text-amber-600">{consistencySummary?.mismatchCount ?? 0}</div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]"><CardContent className="p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.consistency.cards.missingSummary', { defaultValue: 'Eksik Summary' })}</div><div className="mt-2 text-2xl font-semibold text-rose-600">{consistencySummary?.missingSummaryCount ?? 0}</div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]"><CardContent className="p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.consistency.cards.extraSummary', { defaultValue: 'Fazla Summary' })}</div><div className="mt-2 text-2xl font-semibold text-fuchsia-600">{consistencySummary?.extraSummaryCount ?? 0}</div></CardContent></Card>
        </div>

        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="p-5">
            <PagedDataGrid<WarehouseBalanceConsistencyIssueDto, ConsistencyColumnKey>
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
              errorText={(consistencyIssuesQuery.error instanceof Error ? consistencyIssuesQuery.error.message : undefined) ?? (consistencySummaryQuery.error instanceof Error ? consistencySummaryQuery.error.message : t('common.error', { defaultValue: 'Bir hata olustu' }))}
              emptyText={t('warehouseBalance.consistency.empty', { defaultValue: 'Tutarsizlik bulunamadi' })}
              pageSize={consistencyIssuesQuery.data?.data?.pageSize ?? consistencyGrid.pageSize}
              pageSizeOptions={consistencyGrid.pageSizeOptions}
              onPageSizeChange={consistencyGrid.handlePageSizeChange}
              pageNumber={consistencyGrid.getDisplayPageNumber(consistencyIssuesQuery.data?.data)}
              totalPages={consistencyIssuesQuery.data?.data?.totalPages ?? 0}
              hasPreviousPage={consistencyIssuesQuery.data?.data?.hasPreviousPage ?? false}
              hasNextPage={consistencyIssuesQuery.data?.data?.hasNextPage ?? false}
              onPreviousPage={consistencyGrid.goToPreviousPage}
              onNextPage={consistencyGrid.goToNextPage}
              previousLabel={t('common.previous', { defaultValue: 'Onceki' })}
              nextLabel={t('common.next', { defaultValue: 'Sonraki' })}
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
                placeholder: t('warehouseBalance.consistency.searchPlaceholder', { defaultValue: 'Depo, stok, yapkod veya sorun tipi ara...' }),
              }}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
