import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdValidationLogDto } from '../types/kkd.types';

type ValidationColumnKey =
  | 'createdDate'
  | 'employee'
  | 'customerCode'
  | 'stock'
  | 'groupCode'
  | 'attemptedQuantity'
  | 'reasonCode'
  | 'reasonMessage';

function mapSortBy(value: ValidationColumnKey): string {
  switch (value) {
    case 'createdDate':
      return 'CreatedDate';
    case 'employee':
      return 'EmployeeCode';
    case 'customerCode':
      return 'CustomerCode';
    case 'stock':
      return 'StockCode';
    case 'groupCode':
      return 'GroupCode';
    case 'attemptedQuantity':
      return 'AttemptedQuantity';
    case 'reasonCode':
      return 'ReasonCode';
    case 'reasonMessage':
      return 'ReasonMessage';
    default:
      return 'CreatedDate';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

export function KkdValidationLogPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdValidationLogDto | null>(null);
  const pagedGrid = usePagedDataGrid<ValidationColumnKey>({
    pageKey: 'kkd-validation-log-grid',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle('KKD Validation Log');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const query = useQuery({
    queryKey: ['kkd', 'validation-logs', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getValidationLogs(pagedGrid.queryParams, { signal }),
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ValidationColumnKey>[]>(
    () => [
      { key: 'createdDate', label: 'Zaman' },
      { key: 'employee', label: 'Çalışan' },
      { key: 'customerCode', label: 'Cari' },
      { key: 'stock', label: 'Stok' },
      { key: 'groupCode', label: 'Grup' },
      { key: 'attemptedQuantity', label: 'Miktar' },
      { key: 'reasonCode', label: 'Kod' },
      { key: 'reasonMessage', label: 'Açıklama' },
    ],
    [],
  );

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD Validation Log', isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Validation Kayıtları</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdValidationLogDto, ValidationColumnKey>
              pageKey="kkd-validation-log"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'createdDate':
                    return formatDate(row.createdDate);
                  case 'employee':
                    return row.employeeCode ? `${row.employeeCode} - ${row.employeeName || ''}`.trim() : row.employeeName || '-';
                  case 'customerCode':
                    return row.customerCode || '-';
                  case 'stock':
                    return row.stockCode ? `${row.stockCode} - ${row.stockName || ''}`.trim() : row.stockName || '-';
                  case 'groupCode':
                    return row.groupCode || '-';
                  case 'attemptedQuantity':
                    return row.attemptedQuantity;
                  case 'reasonCode':
                    return row.reasonCode;
                  case 'reasonMessage':
                    return row.reasonMessage || '-';
                  default:
                    return '-';
                }
              }}
              sortBy={pagedGrid.sortBy}
              sortDirection={pagedGrid.sortDirection}
              onSort={pagedGrid.handleSort}
              onRowClick={setSelectedRow}
              pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
              pageSizeOptions={pagedGrid.pageSizeOptions}
              onPageSizeChange={pagedGrid.handlePageSizeChange}
              pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
              totalPages={query.data?.totalPages ?? 0}
              hasPreviousPage={query.data?.hasPreviousPage ?? false}
              hasNextPage={query.data?.hasNextPage ?? false}
              onPreviousPage={pagedGrid.goToPreviousPage}
              onNextPage={pagedGrid.goToNextPage}
              previousLabel="Önceki"
              nextLabel="Sonraki"
              paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText="Validation log yüklenemedi."
              emptyText="Validation kaydı bulunamadı."
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: 'Çalışan, stok, grup veya hata kodu ara',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kayıt Detayı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRow ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedRow.reasonCode}</Badge>
                  {selectedRow.groupCode ? <Badge variant="secondary">{selectedRow.groupCode}</Badge> : null}
                  <Badge variant="outline">{formatDate(selectedRow.createdDate)}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Çalışan / Cari</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {(selectedRow.employeeCode || selectedRow.employeeName) ? `${selectedRow.employeeCode || ''} ${selectedRow.employeeName || ''}`.trim() : '-'} / {selectedRow.customerCode || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Stok / Miktar</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {(selectedRow.stockCode || selectedRow.stockName) ? `${selectedRow.stockCode || ''} ${selectedRow.stockName || ''}`.trim() : '-'} / {selectedRow.attemptedQuantity}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mesaj</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{selectedRow.reasonMessage || '-'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                  QR: {selectedRow.scannedQr || '-'}<br />
                  Barkod: {selectedRow.scannedBarcode || '-'}<br />
                  Depo: {selectedRow.warehouseId || '-'}<br />
                  Cihaz: {selectedRow.deviceInfo || '-'}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Soldan bir validation kaydı seçtiğinde detayını burada görürsün.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
