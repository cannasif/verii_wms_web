import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { MasterDataOpsErpEyebrow, MasterDataOpsStatGrid, masterDataOpsGridColumn } from '@/features/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { WarehouseStockSerialBalanceDto } from '../types/warehouse-balance.types';
import { warehouseBalanceApi } from '../api/warehouse-balance.api';

type SerialColumnKey =
  | 'warehouse'
  | 'shelf'
  | 'stock'
  | 'yapKod'
  | 'serials'
  | 'quantity'
  | 'status'
  | 'transactionDate';

function mapSortBy(value: SerialColumnKey): string {
  switch (value) {
    case 'warehouse':
      return 'WarehouseName';
    case 'shelf':
      return 'ShelfCode';
    case 'stock':
      return 'StockCode';
    case 'yapKod':
      return 'YapKodCode';
    case 'serials':
      return 'SerialNo';
    case 'quantity':
      return 'Quantity';
    case 'status':
      return 'StockStatus';
    case 'transactionDate':
    default:
      return 'LastTransactionDate';
  }
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

export function WarehouseStockSerialBalancePage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const pagedGrid = usePagedDataGrid<SerialColumnKey>({
    pageKey: 'warehouse-serial-balance-grid',
    defaultSortBy: 'transactionDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('sidebar.erpWarehouseSerialBalance', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['warehouse-balance', 'serial', pagedGrid.queryParams],
    queryFn: ({ signal }) => warehouseBalanceApi.getSerialPaged(pagedGrid.queryParams, { signal }),
  });

  const rows = query.data?.data?.data ?? [];
  const range = getPagedRange(query.data?.data);

  const columns = useMemo<PagedDataGridColumn<SerialColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('warehouse', t('warehouseBalance.serial.columns.warehouse', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('shelf', t('warehouseBalance.serial.columns.shelf', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('stock', t('warehouseBalance.serial.columns.stock', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('yapKod', t('warehouseBalance.serial.columns.yapKod', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('serials', t('warehouseBalance.serial.columns.serials', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('quantity', t('warehouseBalance.serial.columns.quantity', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('status', t('warehouseBalance.serial.columns.status', { defaultValue: 'Missing translation' })),
      masterDataOpsGridColumn('transactionDate', t('warehouseBalance.serial.columns.transactionDate', { defaultValue: 'Missing translation' })),
    ],
    [t],
  );

  const totalQuantity = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows]);

  return (
    <OpsListPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpWarehouseSerialBalance')} />}
      title={t('sidebar.erpWarehouseSerialBalance')}
      description={t('warehouseBalance.serial.subtitle')}
      actions={
        <OpsActionButton type="button" variant="secondary" onClick={() => void query.refetch()}>
          <RefreshCcw className="size-3.5" aria-hidden />
          {t('common.refresh')}
        </OpsActionButton>
      }
    >
      <MasterDataOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('warehouseBalance.serial.cards.rows', { defaultValue: 'Missing translation' }), value: query.data?.data?.totalCount ?? 0 },
          { label: t('warehouseBalance.serial.cards.quantity', { defaultValue: 'Missing translation' }), value: formatNumber(totalQuantity) },
          { label: t('warehouseBalance.serial.cards.filtered', { defaultValue: 'Missing translation' }), value: rows.length },
        ]}
      />

      <section className="wms-ops-receiving-area border">
        <div className="wms-ops-form p-4 sm:p-5">
          <PagedDataGrid<WarehouseStockSerialBalanceDto, SerialColumnKey>
            variant="ops"
            pageKey="warehouse-serial-balance-grid"
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
                case 'shelf':
                  return row.shelfCode || row.shelfName
                    ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{row.shelfCode ?? '-'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.shelfName ?? '-'}</span>
                      </div>
                    )
                    : '-';
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
                case 'serials':
                  return (
                    <div className="flex flex-col">
                      <span>{row.serialNo ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.serialNo2 ?? '-'} / {row.serialNo3 ?? '-'}</span>
                    </div>
                  );
                case 'quantity':
                  return formatNumber(row.quantity);
                case 'status':
                  return row.stockStatus ?? '-';
                case 'transactionDate':
                  return formatDate(row.lastTransactionDate);
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
            emptyText={t('warehouseBalance.serial.empty', { defaultValue: 'Missing translation' })}
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
              placeholder: t('warehouseBalance.serial.searchPlaceholder', { defaultValue: 'Missing translation' }),
            }}
            refresh={{
              onRefresh: () => void query.refetch(),
              isLoading: query.isLoading,
              label: t('common.refresh'),
            }}
          />
        </div>
      </section>
    </OpsListPageShell>
  );
}
