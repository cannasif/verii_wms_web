import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Barcode, Layers3, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
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
    setPageTitle(t('sidebar.erpWarehouseSerialBalance', { defaultValue: 'Depo Seri Bakiyesi' }));
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
      { key: 'warehouse', label: t('warehouseBalance.serial.columns.warehouse', { defaultValue: 'Depo' }) },
      { key: 'shelf', label: t('warehouseBalance.serial.columns.shelf', { defaultValue: 'Raf / Hucre' }) },
      { key: 'stock', label: t('warehouseBalance.serial.columns.stock', { defaultValue: 'Stok' }) },
      { key: 'yapKod', label: t('warehouseBalance.serial.columns.yapKod', { defaultValue: 'YapKod' }) },
      { key: 'serials', label: t('warehouseBalance.serial.columns.serials', { defaultValue: 'Seriler' }) },
      { key: 'quantity', label: t('warehouseBalance.serial.columns.quantity', { defaultValue: 'Miktar' }) },
      { key: 'status', label: t('warehouseBalance.serial.columns.status', { defaultValue: 'Stok Durumu' }) },
      { key: 'transactionDate', label: t('warehouseBalance.serial.columns.transactionDate', { defaultValue: 'Son Hareket' }) },
    ],
    [t],
  );

  const totalQuantity = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows]);

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'ERP' }) },
          { label: t('sidebar.erpWarehouseSerialBalance', { defaultValue: 'Depo Seri Bakiyesi' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">WarehouseBalance</Badge>
              <Badge variant="secondary">Serial Detail</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {t('sidebar.erpWarehouseSerialBalance', { defaultValue: 'Depo Seri Bakiyesi' })}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Stok, seri ve raf bazli detay bakiyeyi izleyin; hangi serinin hangi rafta oldugunu hizli filtreleyin.
            </p>
          </div>
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCcw className="mr-2 size-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <Layers3 className="size-5 text-sky-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.serial.cards.rows', { defaultValue: 'Kayit' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{query.data?.data?.totalCount ?? 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <Barcode className="size-5 text-fuchsia-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.serial.cards.quantity', { defaultValue: 'Toplam Miktar' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(totalQuantity)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardContent className="flex items-center gap-3 p-5">
            <RefreshCcw className="size-5 text-emerald-600" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('warehouseBalance.serial.cards.filtered', { defaultValue: 'Gorunen Satirlar' })}</div>
              <div className="text-2xl font-semibold text-slate-950 dark:text-white">{rows.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
        <CardContent className="p-5">
          <PagedDataGrid<WarehouseStockSerialBalanceDto, SerialColumnKey>
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
            errorText={query.error instanceof Error ? query.error.message : t('common.error', { defaultValue: 'Bir hata olustu' })}
            emptyText={t('warehouseBalance.serial.empty', { defaultValue: 'Depo seri bakiye kaydi bulunamadi' })}
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
              placeholder: t('warehouseBalance.serial.searchPlaceholder', { defaultValue: 'Depo, raf, stok veya seri ara...' }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
